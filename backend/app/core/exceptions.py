class LLMUnavailableError(Exception):
    """Raised when both Groq and Ollama are unreachable."""
    pass


class InvalidSQLOutputError(Exception):
    """Raised when LLM returns output that is not valid SQL."""
    pass


class DataLoadError(Exception):
    """Raised when one or more CSV files cannot be loaded into DuckDB."""
    pass


class UnavailableDataError(Exception):
    """Raised when the requested concept has no columns in this dataset."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)
