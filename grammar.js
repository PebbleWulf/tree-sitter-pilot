/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// PILOT (Programmed Instruction, Learning, Or Teaching) grammar for Tree-sitter.
//
// PILOT is a line-oriented language: each line is one of:
//   - A label:     *LABELNAME
//   - A remark:    R: free text comment
//   - A statement: CMD[YN]: body text
//   - A blank line (ignored)
//
// Bodies can contain numeric variables (#VAR), string variables ($VAR),
// the RAND(n) built-in, comparison operators, and plain text.

module.exports = grammar({
  name: 'pilot',

  // Skip horizontal whitespace between tokens.
  // Newlines are NOT skipped — they terminate lines.
  extras: $ => [/[ \t]/],

  rules: {

    // The whole program: zero or more lines.
    // Each line may contain a label, remark, or statement, followed by a newline.
    // The final line's newline is optional to handle files without a trailing newline.
    source_file: $ => seq(
      repeat(seq(
        optional(choice($.label, $.remark, $.statement)),
        /\r?\n/
      )),
      optional(choice($.label, $.remark, $.statement))
    ),

    // ── Labels ─────────────────────────────────────────────────────────────
    // A label is an asterisk followed by an identifier: *START, *LOOP, *END
    label: $ => /\*[A-Za-z_][A-Za-z0-9_]*/,

    // ── Label references ───────────────────────────────────────────────────
    // A label reference is *LABELNAME appearing inside a command body.
    // It uses the same pattern as a standalone label definition but is a
    // separate node so that definitions and references can be styled
    // independently if desired.
    // Examples: J: *START   U: *CHECK_ANSWER   JN: *LOOP
    label_ref: $ => /\*[A-Za-z_][A-Za-z0-9_]*/,

    // ── Remarks ────────────────────────────────────────────────────────────
    // A remark begins with R: (or RY: / RN:) and continues to end of line.
    // The entire line — including any embedded text — is treated as a comment.
    // It is modelled as a single token so highlights.scm can colour it whole.
    remark: $ => token(seq(
      /[Rr][YNyn]?[ \t]*:/,
      /[^\n]*/
    )),

    // ── Statements ─────────────────────────────────────────────────────────
    // A statement is a command token followed by an optional body.
    statement: $ => seq(
      $.command,
      optional($.body)
    ),

    // The command token: a letter (T A C M J U E S), an optional Y/N
    // condition suffix, optional whitespace, and a colon.
    // Examples: T:   TY:   JN:   CY:   A:   S:
    command: $ => token(seq(
      /[TACMJUEStacmjues]/,
      /[YNyn]?/,
      /[ \t]*/,
      ':'
    )),

    // ── Statement body ─────────────────────────────────────────────────────
    // A body is one or more body elements (variables, RAND, operators, text).
    body: $ => repeat1(choice(
      $.variable_numeric,
      $.variable_string,
      $.rand_call,
      $.label_ref,       // label reference, e.g. *START, *THE_SUB
      $.operator,
      $.operator_char,
      $.text_fragment
    )),

    // Numeric variable: #VARNAME  (e.g. #HP, #SCORE, #TICK)
    variable_numeric: $ => /#[A-Za-z_][A-Za-z0-9_]*/,

    // String variable: $VARNAME  (e.g. $NAME, $E_NAME)
    variable_string: $ => /\$[A-Za-z_][A-Za-z0-9_]*/,

    // Built-in random function: RAND(n)  (e.g. RAND(6), RAND(100))
    rand_call: $ => /[Rr][Aa][Nn][Dd]\([^)\n]+\)/,

    // Two-character comparison / assignment operators: == != >= <= > <
    // Tree-sitter picks the longest match, so >= beats > when = follows.
    operator: $ => choice('==', '!=', '>=', '<=', '>', '<'),

    // Standalone = or ! that didn't form a two-char operator.
    // (In PILOT, = is used for assignment; ! rarely appears alone.)
    operator_char: $ => /[=!]/,

    // Plain body text: anything that is not a newline, variable sigil,
    // operator character, or label-ref asterisk.  The + requires at least
    // one character, preventing an infinite empty-match loop inside repeat1().
    text_fragment: $ => /[^\n#$=!<>*]+/,
  }
});
