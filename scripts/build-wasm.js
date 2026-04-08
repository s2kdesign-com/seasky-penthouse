#!/usr/bin/env node
'use strict';

// Compiles wasm/calendar.wat → src/public/calendar.wasm
// Run via: npm run build:wasm

const wabt  = require('wabt');
const fs    = require('fs');
const path  = require('path');

const SRC  = path.join(__dirname, '..', 'wasm',       'calendar.wat');
const DEST = path.join(__dirname, '..', 'src', 'public', 'calendar.wasm');

(async () => {
  const wabtModule = await wabt();
  const watSource  = fs.readFileSync(SRC, 'utf8');

  const parsed = wabtModule.parseWat('calendar.wat', watSource, {
    mutable_globals:           true,
    sat_float_to_int:          true,
    sign_extension:            true,
    bulk_memory:               true,
    multi_value:               true,
    exceptions:                false,
    simd:                      false,
    threads:                   false,
    tail_call:                 false,
  });

  const { buffer } = parsed.toBinary({ log: false, write_debug_names: true });
  fs.writeFileSync(DEST, Buffer.from(buffer));

  console.log(`✓ Compiled calendar.wat → src/public/calendar.wasm (${buffer.byteLength} bytes)`);
  parsed.destroy();
})().catch(err => { console.error(err); process.exit(1); });
