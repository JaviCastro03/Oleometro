"""Tiny thread-safe time-based cache (no external dependency)."""

from __future__ import annotations

import threading
import time
from typing import Callable, Generic, TypeVar

T = TypeVar("T")


class TTLValue(Generic[T]):
    """Holds one lazily computed value that expires after ``ttl`` seconds."""

    def __init__(self, loader: Callable[[], T], ttl: float) -> None:
        self._loader = loader
        self._ttl = ttl
        self._lock = threading.Lock()
        self._value: T | None = None
        self._expires_at = 0.0

    def get(self) -> T:
        with self._lock:
            now = time.monotonic()
            if self._value is None or now >= self._expires_at:
                self._value = self._loader()
                self._expires_at = now + self._ttl
            return self._value

    def clear(self) -> None:
        with self._lock:
            self._value = None
            self._expires_at = 0.0
