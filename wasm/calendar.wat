;; SeaSky Penthouse — Calendar WASM utilities
;; Compiled to calendar.wasm via: npm run build:wasm

(module
  ;; nightCount: number of nights between two Unix timestamps (milliseconds)
  ;; Returns 0 if end <= start
  (func $nightCount (export "nightCount")
    (param $startMs i64)
    (param $endMs   i64)
    (result i32)
    (local $diff i64)
    (local.set $diff (i64.sub (local.get $endMs) (local.get $startMs)))
    (if (i64.le_s (local.get $diff) (i64.const 0))
      (then (return (i32.const 0)))
    )
    (i32.wrap_i64
      (i64.div_s (local.get $diff) (i64.const 86400000))
    )
  )

  ;; daysOverlap: returns 1 if ranges [s1,e1) and [s2,e2) overlap, 0 otherwise
  (func $daysOverlap (export "daysOverlap")
    (param $s1 i64) (param $e1 i64)
    (param $s2 i64) (param $e2 i64)
    (result i32)
    (i32.and
      (i64.lt_s (local.get $s1) (local.get $e2))
      (i64.lt_s (local.get $s2) (local.get $e1))
    )
  )

  ;; isToday: returns 1 if the given timestamp (ms, UTC midnight) is today
  (func $isToday (export "isToday")
    (param $dayMs    i64)   ;; UTC midnight of the day to test
    (param $nowMs    i64)   ;; current time (Date.now())
    (result i32)
    (local $todayStart i64)
    (local $todayEnd   i64)
    ;; align nowMs down to day boundary (floor division by 86400000)
    (local.set $todayStart
      (i64.mul
        (i64.div_s (local.get $nowMs) (i64.const 86400000))
        (i64.const 86400000)
      )
    )
    (local.set $todayEnd (i64.add (local.get $todayStart) (i64.const 86400000)))
    (i32.and
      (i64.ge_s (local.get $dayMs) (local.get $todayStart))
      (i64.lt_s (local.get $dayMs) (local.get $todayEnd))
    )
  )
)
