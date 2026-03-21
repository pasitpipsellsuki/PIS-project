# AGENTS.md - Guidelines for AI Agents

This file provides guidelines for AI agents operating in this repository.

## Build/Lint/Test Commands

```bash
# Run all tests
pytest

# Run a single test
pytest path/to/test_file.py::test_function_name

# Run tests with coverage
pytest --cov=src --cov-report=term-missing

# Lint code
ruff check .
ruff check --fix .

# Format code
ruff format .
black .

# Type check
mypy src/
pyright

# Run all checks (CI)
ruff check . && ruff format --check . && mypy src/ && pytest
```

## Code Style Guidelines

### General Principles
- Keep code simple and readable
- Follow existing patterns in the codebase
- Write self-documenting code with clear variable names
- Avoid premature optimization
- Keep functions small and focused (single responsibility)

### Naming Conventions
- Use `snake_case` for variables, functions, and methods
- Use `PascalCase` for class names
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names that reveal intent
- Avoid single-letter variables except in loops or mathematical contexts

### Imports
- Use absolute imports when possible
- Group imports: stdlib, third-party, local
- Sort imports alphabetically within groups
- Avoid wildcard imports (`from module import *`)
- Use explicit imports: `from typing import List, Optional`

### Types
- Add type hints to all function signatures
- Use `from __future__ import annotations` for Python 3.9+
- Use `Optional[Type]` or `Type | None` for nullable types
- Use `list[str]` instead of `List[str]` with future annotations
- Use `dict`, `list`, `tuple` instead of `Dict`, `List`, `Tuple` with future annotations

### Functions
- Keep functions under 50 lines when possible
- Use type hints for parameters and return values
- Use docstrings for public functions
- Prefer pure functions when possible
- Use early returns to reduce nesting

### Classes
- Use dataclasses for data containers
- Keep methods focused and cohesive
- Follow the single responsibility principle
- Use property decorators for computed attributes

### Error Handling
- Use specific exception types, not bare `except:`
- Always log exceptions with context
- Raise early, fail fast
- Provide helpful error messages
- Use `try/except/else/finally` appropriately

### Documentation
- Add docstrings to all public modules, classes, and functions
- Use Google or NumPy style docstrings
- Include type information in docstrings when not using type hints
- Keep comments focused on "why", not "what"

### Testing
- Write unit tests for all new functionality
- Use pytest fixtures for common test setups
- Use descriptive test function names: `test_should_do_something_when_condition`
- Keep tests independent and isolated
- Use mocking sparingly and only for external dependencies

### Git
- Make small, focused commits
- Use clear commit messages describing the "why"
- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Never commit secrets or credentials
- Review your changes before committing

## Security
- Never hardcode secrets in code
- Use environment variables for configuration
- Validate all inputs
- Sanitize data before logging
- Follow the principle of least privilege

## Performance
- Optimize for readability first
- Profile before optimizing
- Use appropriate data structures
- Be mindful of memory usage with large datasets
- Cache expensive computations when appropriate

## AI Agent Specific Instructions
- Always run linting and type checking after making changes
- Verify tests pass before marking tasks complete
- Ask for clarification on ambiguous requirements
- Suggest improvements when you see opportunities
- Never commit changes unless explicitly asked
- Use the todo list tool for multi-step tasks
- Check AGENTS.md before starting work
- Verify your understanding of the codebase by reading existing files
- Follow existing code patterns and conventions
- Be concise and direct in your responses
- Never guess URLs or file paths

## Project Structure
- `agents/` - Agent implementations
- `backlog/` - Project backlog items
- `pipeline/` - Pipeline components
- `skills/` - Skill definitions and implementations

## Communication
- Be direct and concise in responses
- Focus on the specific task at hand
- Avoid unnecessary explanations unless asked
- Use code references with line numbers when appropriate
- Ask for user input when requirements are unclear

---
Last updated: 2026-03-21
