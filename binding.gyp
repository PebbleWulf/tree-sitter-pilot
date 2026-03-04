{
  "targets": [
    {
      "target_name": "tree_sitter_pilot_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "node_modules/tree-sitter/src"
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c"
      ],
      "cflags_c": ["-std=c99", "-fvisibility=default"]
    }
  ]
}
