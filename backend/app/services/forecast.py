"""Previsión de precios: lógica pura, sin red ni base de datos.

PAPEL EN MVC: es un SERVICIO (cocina). Recibe la serie semanal de precios y
devuelve una estimación a 1 semana, 1 mes y 1 año, con un rango de confianza.

MÉTODO (explicable en una frase):
    "Miro hacia dónde iba el precio últimamente (tendencia), le sumo lo que
     suele pasar en cada mes del año (estacionalidad) y la tendencia se va
     frenando poco a poco, porque nadie sube eternamente."

Técnicamente: suavizado exponencial de Holt con tendencia amortiguada sobre el
logaritmo del precio, más factores estacionales por mes.

HONESTIDAD: el precio del aceite depende de clima, cosecha y política, cosas
que el histórico no ve. Por eso cada previsión incluye:
  - un RANGO (el 80 % de las veces el precio real cayó dentro, en el pasado), y
  - un BACKTEST: cuánto habría acertado este mismo método en el pasado reciente,
    comparado con la apuesta tonta de "el precio se queda igual".
"""

from __future__ import annotations

from datetime import date, timedelta
from math import exp, log, sqrt
from typing import Sequence

from ..models.records import BacktestStats, Forecast, ForecastHorizon

Point = tuple[date, float]

# Horizontes que enseñamos: nombre, número de semanas y cambio mínimo (en %)
# para considerar que "sube" o "baja" en vez de "estable".
HORIZONS = (
    ("week", 1, 0.5),
    ("month", 4, 1.5),
    ("year", 52, 5.0),
)
MAX_WEEKS = 52          # la línea de previsión llega hasta 1 año
MIN_POINTS = 60         # con menos semanas de histórico no prevemos nada
MIN_SEASONAL_POINTS = 104   # la estacionalidad necesita al menos 2 años
Z_80 = 1.2816           # multiplicador para un rango del 80 %
SEASONAL_SHRINK = 0.5   # nos fiamos solo a medias de la estacionalidad (es ruidosa)

# Combinaciones de parámetros que probamos y de entre las que elegimos la mejor.
# alpha: cuánto pesa el dato nuevo en el nivel; beta: lo mismo para la tendencia;
# phi: cuánto "se frena" la tendencia cada semana (1 = nunca se frena).
_ALPHAS = (0.2, 0.4, 0.6, 0.8)
_BETAS = (0.02, 0.05, 0.1, 0.2)
_PHIS = (0.90, 0.95, 0.98)
_FIT_HORIZON = 4        # elegimos parámetros mirando el acierto a 4 semanas


# ---------------------------------------------------------------- estacionalidad


def seasonal_factors(dates: Sequence[date], logs: Sequence[float]) -> dict[int, float]:
    """Cuánto se desvía cada mes (1..12) de la media anual, en escala logarítmica.

    Para cada semana comparamos su precio con la media de las 52 semanas que la
    rodean; luego promediamos esa diferencia por mes. Si hay menos de 2 años de
    datos devolvemos ceros (sin estacionalidad) en lugar de inventarla.
    """
    n = len(logs)
    if n < MIN_SEASONAL_POINTS:
        return {m: 0.0 for m in range(1, 13)}

    sums = {m: 0.0 for m in range(1, 13)}
    counts = {m: 0 for m in range(1, 13)}
    for t in range(26, n - 26):
        centred_mean = sum(logs[t - 26 : t + 26]) / 52
        month = dates[t].month
        sums[month] += logs[t] - centred_mean
        counts[month] += 1

    raw = {m: (sums[m] / counts[m] if counts[m] else 0.0) for m in sums}
    centre = sum(raw.values()) / 12  # que la suma de los 12 factores sea ~0
    return {m: (raw[m] - centre) * SEASONAL_SHRINK for m in raw}


# ---------------------------------------------------------------- Holt amortiguado


def _damped_sum(phi: float, steps: int) -> float:
    """phi + phi^2 + ... + phi^steps (cuánta tendencia se acumula en 'steps' semanas)."""
    return sum(phi**i for i in range(1, steps + 1))


def _run_filter(z: Sequence[float], alpha: float, beta: float, phi: float) -> tuple[float, float]:
    """Recorre la serie y devuelve el último (nivel, tendencia)."""
    level, trend = z[0], 0.0
    for value in z[1:]:
        previous_level = level
        level = alpha * value + (1 - alpha) * (previous_level + phi * trend)
        trend = beta * (level - previous_level) + (1 - beta) * phi * trend
    return level, trend


def _fit_error(z: Sequence[float], alpha: float, beta: float, phi: float) -> float:
    """Error cuadrático medio al predecir _FIT_HORIZON semanas vista con estos parámetros.

    Recorremos la serie; tras ver cada semana t, predecimos la semana t+4 y
    comparamos con lo que de verdad pasó.
    """
    level, trend = z[0], 0.0
    gain = _damped_sum(phi, _FIT_HORIZON)
    total, count = 0.0, 0
    for t in range(1, len(z)):
        previous_level = level
        level = alpha * z[t] + (1 - alpha) * (previous_level + phi * trend)
        trend = beta * (level - previous_level) + (1 - beta) * phi * trend
        if t >= 8 and t + _FIT_HORIZON < len(z):
            total += (z[t + _FIT_HORIZON] - (level + trend * gain)) ** 2
            count += 1
    return total / count if count else float("inf")


def fit_parameters(z: Sequence[float]) -> tuple[float, float, float]:
    """Elige (alpha, beta, phi) probando todas las combinaciones y quedándose con la de menor error."""
    best, best_error = (0.4, 0.05, 0.95), float("inf")
    for alpha in _ALPHAS:
        for beta in _BETAS:
            for phi in _PHIS:
                error = _fit_error(z, alpha, beta, phi)
                if error < best_error:
                    best, best_error = (alpha, beta, phi), error
    return best


def forecast_logs(
    dates: Sequence[date],
    logs: Sequence[float],
    params: tuple[float, float, float],
    steps: int,
) -> list[float]:
    """Previsión (en logaritmos) para las próximas 1..steps semanas."""
    alpha, beta, phi = params
    seasonal = seasonal_factors(dates, logs)
    deseasonalised = [y - seasonal[d.month] for d, y in zip(dates, logs)]
    level, trend = _run_filter(deseasonalised, alpha, beta, phi)

    last = dates[-1]
    out = []
    for h in range(1, steps + 1):
        target_month = (last + timedelta(weeks=h)).month
        out.append(level + trend * _damped_sum(phi, h) + seasonal[target_month])
    return out


# ---------------------------------------------------------------- backtest


class _BacktestData:
    """Errores acumulados de la previsión en el pasado, por horizonte (en semanas)."""

    def __init__(self) -> None:
        self.model_err: dict[int, list[float]] = {h: [] for h in range(1, MAX_WEEKS + 1)}
        self.naive_err: dict[int, list[float]] = {h: [] for h in range(1, MAX_WEEKS + 1)}
        self.log_err: dict[int, list[float]] = {h: [] for h in range(1, MAX_WEEKS + 1)}
        self.direction: dict[int, list[bool]] = {h: [] for h in range(1, MAX_WEEKS + 1)}


def _backtest(dates: Sequence[date], logs: Sequence[float], params: tuple[float, float, float], window: int) -> _BacktestData:
    """Simula "qué habría predicho este método" desde varios momentos del pasado.

    En cada punto de partida solo se usan datos anteriores a él (sin hacer
    trampa) y se compara la previsión con lo que realmente pasó después.
    """
    data = _BacktestData()
    n = len(logs)
    thresholds = {h: thr for _, h, thr in HORIZONS}
    for origin in range(n - window, n - 1, 4):
        steps = min(MAX_WEEKS, n - 1 - origin)
        predicted = forecast_logs(dates[: origin + 1], logs[: origin + 1], params, steps)
        base = logs[origin]
        for h in range(1, steps + 1):
            actual = logs[origin + h]
            data.log_err[h].append(actual - predicted[h - 1])
            data.model_err[h].append(abs(exp(actual - predicted[h - 1]) - 1))
            data.naive_err[h].append(abs(exp(actual - base) - 1))
            if h in thresholds and abs(exp(predicted[h - 1] - base) - 1) * 100 >= thresholds[h]:
                data.direction[h].append((predicted[h - 1] - base) * (actual - base) > 0)
    return data


def _stats_for(data: _BacktestData, weeks: int) -> BacktestStats | None:
    """Resume el backtest de un horizonte en 3 números fáciles de entender."""
    errors = data.model_err[weeks]
    if len(errors) < 8:
        return None
    mae = sum(errors) / len(errors)
    naive = sum(data.naive_err[weeks]) / len(errors)
    hits = data.direction[weeks]
    return BacktestStats(
        samples=len(errors),
        mean_error_pct=round(mae * 100, 1),
        vs_naive_pct=round((1 - mae / naive) * 100, 1) if naive > 0 else None,
        direction_hit_pct=round(100 * sum(hits) / len(hits), 0) if len(hits) >= 5 else None,
        direction_samples=len(hits),
    )


def _sigma_by_horizon(data: _BacktestData, logs: Sequence[float]) -> dict[int, float]:
    """Desviación típica del error para cada horizonte 1..52 (para dibujar el rango).

    Si hay pocas pruebas en el pasado para un horizonte, se estima a partir de
    cuánto se mueve el precio de una semana a otra, escalado con la raíz del tiempo.
    """
    weekly_moves = [logs[i + 1] - logs[i] for i in range(len(logs) - 1)]
    mean_move = sum(weekly_moves) / len(weekly_moves)
    sigma_week = sqrt(sum((m - mean_move) ** 2 for m in weekly_moves) / max(1, len(weekly_moves) - 1))

    sigma: dict[int, float] = {}
    running_max = 0.0
    for h in range(1, MAX_WEEKS + 1):
        errors = data.log_err[h]
        if len(errors) >= 8:
            value = sqrt(sum(e * e for e in errors) / len(errors))  # error típico (RMS)
        else:
            value = sigma_week * sqrt(h)
        running_max = max(running_max, value)  # el rango nunca se estrecha al mirar más lejos
        sigma[h] = running_max
    return sigma


# ---------------------------------------------------------------- API pública


def _direction(change_pct: float, low: float, high: float, last: float, threshold: float) -> tuple[str, str]:
    """Convierte la previsión en una etiqueta: (dirección, fuerza).

    - 'up' / 'down' con fuerza 'clear': el rango entero está por encima/debajo del precio actual.
    - 'up' / 'down' con fuerza 'weak': la previsión apunta en esa dirección pero el rango aún incluye el precio actual.
    - 'flat': el cambio previsto es menor que el umbral; se espera estabilidad.
    """
    if abs(change_pct) < threshold:
        return "flat", "weak"
    direction = "up" if change_pct > 0 else "down"
    clear = low > last if direction == "up" else high < last
    return direction, "clear" if clear else "weak"


def compute_forecast(points: Sequence[Point]) -> Forecast | None:
    """Previsión completa de una serie semanal, o None si hay muy pocos datos."""
    if len(points) < MIN_POINTS:
        return None

    dates = [p[0] for p in points]
    logs = [log(p[1]) for p in points]
    n = len(logs)
    last_date, last_price = points[-1]

    # 1) Elegimos parámetros con el pasado previo a la ventana de prueba, así el
    #    backtest no hace trampa.
    window = min(156, n // 2)
    train = logs[: n - window]
    train_seasonal = seasonal_factors(dates[: n - window], train)
    train_z = [y - train_seasonal[d.month] for d, y in zip(dates, train)]
    backtest_params = fit_parameters(train_z)
    backtest = _backtest(dates, logs, backtest_params, window)

    # 2) Para la previsión final se reajustan con todos los datos.
    full_seasonal = seasonal_factors(dates, logs)
    full_z = [y - full_seasonal[d.month] for d, y in zip(dates, logs)]
    params = fit_parameters(full_z)
    predicted = forecast_logs(dates, logs, params, MAX_WEEKS)
    sigma = _sigma_by_horizon(backtest, logs)

    # 3) Línea completa (semana 1..52) con su rango.
    path = tuple(
        (
            last_date + timedelta(weeks=h),
            round(exp(predicted[h - 1]), 2),
            round(exp(predicted[h - 1] - Z_80 * sigma[h]), 2),
            round(exp(predicted[h - 1] + Z_80 * sigma[h]), 2),
        )
        for h in range(1, MAX_WEEKS + 1)
    )

    # 4) Resumen de los 3 horizontes que enseñamos como tarjetas.
    horizons = []
    for key, weeks, threshold in HORIZONS:
        target_date, price, low, high = path[weeks - 1]
        change = (price / last_price - 1) * 100
        direction, strength = _direction(change, low, high, last_price, threshold)
        horizons.append(
            ForecastHorizon(
                key=key,
                weeks=weeks,
                target_date=target_date,
                price=price,
                low=low,
                high=high,
                change_pct=round(change, 2),
                direction=direction,
                strength=strength,
                backtest=_stats_for(backtest, weeks),
            )
        )

    return Forecast(horizons=tuple(horizons), path=path)
