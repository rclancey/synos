# Cross-compiling from MacOS to Synology

You need a cross compiler installed because of a cgo dependency in sqlite. The following worked for me:

```
brew install FiloSottile/musl-cross/musl-cross
```

(Thanks for the help here: https://github.com/mattn/go-sqlite3/issues/384#issuecomment-433584967)
