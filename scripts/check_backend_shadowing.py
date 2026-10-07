"""Reject local assignments that shadow module imports, using Python's symbol table."""
from pathlib import Path
import symtable


def shadowed_imports(source, filename):
    module = symtable.symtable(source, filename, "exec")
    imports = {symbol.get_name() for symbol in module.get_symbols() if symbol.is_imported()}
    def walk(scope):
        for child in scope.get_children():
            for symbol in child.get_symbols():
                if symbol.get_name() in imports and symbol.is_local() and symbol.is_assigned():
                    yield f"{filename}:{child.get_lineno()}: {child.get_name()} shadows import {symbol.get_name()}"
            yield from walk(child)
    return list(walk(module))


if __name__ == "__main__":
    assert shadowed_imports("from x import cached\ndef f():\n cached = None\n cached()\n", "regression")
    assert not shadowed_imports("from x import cached\ndef f():\n records = cached()\n", "regression")
    root = Path(__file__).resolve().parents[1] / "backend"
    errors = [error for path in root.rglob("*.py")
              for error in shadowed_imports(path.read_text(encoding="utf-8"), str(path))]
    if errors:
        raise SystemExit("\n".join(errors))
    print("Backend imported-name shadowing check passed")
