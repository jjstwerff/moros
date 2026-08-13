# `B1b.1`'s boot switch — the measurement that blocked it

`ask.loft` is five lines and it is the whole finding:

```
$ timeout 20 loft --lib lib/ probe/b1b/ask.loft
asking
$ echo $?
124
```

`host_output` then `host_input` **hangs** when no host is listening. `B1b.1`'s boot switch —
*the page asks which authority it is* — was designed on `P2`'s result that an unanswered
request comes back empty. ⚠ **`P2` measured a host that DECLINED one message, not an ABSENT
one**, and only the first of those terminates. Filed as
[loft#891](https://github.com/loft-lang/loft/issues/891).

`host_name` is not a way round it either: the symbol is in the binary, the function is not —
`error: Unknown function host_name`.

Run it before believing this is still true; a fix upstream turns it into a two-line pass.
