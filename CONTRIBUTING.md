# Contributing to Data Visualization of Time-Tradable Assets Using ML

Thank you for your interest in contributing! Whether you are reporting an issue, improving documentation, submitting feature requests, or writing code, your participation is welcome.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Development Workflow

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/Data-Visualization-Of-Time-Tradable-Assets-Using-ML.git
   cd Data-Visualization-Of-Time-Tradable-Assets-Using-ML
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your modifications**:
   - Ensure frontend follows Angular 22 standalone component patterns with Signals.
   - Ensure backend endpoints follow FastAPI type annotations with Pydantic schemas.
   - Maintain clean, descriptive variable names and document complex algorithms.
5. **Verify builds**:
   ```bash
   # Frontend
   cd frontend && npm run build

   # Backend
   cd ../backend && pytest
   ```
6. **Commit your changes**:
   ```bash
   git commit -m "feat(charts): add stochastic oscillator indicator overlay"
   ```
7. **Push to your fork and submit a Pull Request** to the `main` branch.

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` A new feature or capability
- `fix:` A bug fix or patch
- `docs:` Documentation improvements
- `style:` Formatting or UI styling changes
- `refactor:` Code restructuring without behavior changes
- `perf:` Performance optimizations
- `test:` Adding or updating tests
- `chore:` Maintenance, build scripts, or dependency updates
