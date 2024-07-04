---
order : 8
---

# 8. 内存模型

在并发编程中，内存模型描述了程序中线程或 Goroutine 如何与内存进行交互。了解内存模型对编写并发安全的程序至关重要。Go 语言的内存模型定义了对共享变量的访问顺序规则，确保在并发环境下的程序行为是可预测的。

## Go 内存模型概述

Go 的内存模型主要通过以下规则来保证内存操作的可见性和一致性：

1. **程序顺序规则**：在单个 Goroutine 中，内存操作按程序顺序执行。
2. **传递性规则**：如果操作 A 在操作 B 之前，且操作 B 在操作 C 之前，那么操作 A 必须在操作 C 之前。
3. **同步操作规则**：通过 `sync/atomic` 包的原子操作和 `sync` 包的同步原语（如互斥锁、通道）来定义内存操作之间的同步关系。

## 关键概念

### Happens-Before

"Happens-Before" 是一个关键概念，用于描述操作之间的内存顺序关系。如果一个操作 "happens-before" 另一个操作，那么第一个操作的结果对于第二个操作是可见的。

### 内存屏障

内存屏障是一种 CPU 指令，用于控制内存操作的顺序。Go 编译器和运行时会在适当的位置插入内存屏障，以确保程序符合内存模型的要求。

## 同步原语

Go 提供了多种同步原语来确保内存操作的顺序性和可见性：

### 互斥锁（Mutex）

互斥锁确保在同一时间只有一个 Goroutine 可以访问共享资源。

```go
package main

import (
    "fmt"
    "sync"
)

var (
    mu    sync.Mutex
    count int
)

func increment() {
    mu.Lock()
    count++
    mu.Unlock()
}

func main() {
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            increment()
        }()
    }

    wg.Wait()
    fmt.Println("Final count:", count)
}
```

### 读写锁（RWMutex）

读写锁允许多个 Goroutine 同时读取，但写操作是互斥的。

```go
package main

import (
    "fmt"
    "sync"
)

var (
    mu    sync.RWMutex
    count int
)

func read() int {
    mu.RLock()
    defer mu.RUnlock()
    return count
}

func write() {
    mu.Lock()
    count++
    mu.Unlock()
}

func main() {
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            write()
        }()
    }

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            fmt.Println(read())
        }()
    }

    wg.Wait()
    fmt.Println("Final count:", count)
}
```

### 原子操作

原子操作确保对基本数据类型的操作是不可分割的，无需加锁即可实现并发安全。

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

var count int32

func increment() {
    atomic.AddInt32(&count, 1)
}

func main() {
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            increment()
        }()
    }

    wg.Wait()
    fmt.Println("Final count:", count)
}
```

### 通道（Channels）

通道是 Go 特有的用于 Goroutine 间安全通信的机制，隐式地提供同步和内存可见性保证。

```go
package main

import (
    "fmt"
)

func worker(done chan bool) {
    fmt.Println("Working...")
    done <- true
}

func main() {
    done := make(chan bool)

    go worker(done)

    <-done
    fmt.Println("Work done")
}
```

## 内存模型规则

1. **程序顺序规则**：单个 Goroutine 中的操作按程序顺序执行。
2. **解锁-加锁规则**：对一个互斥锁的解锁操作 happens-before 该互斥锁的后续加锁操作。
3. **通道传递规则**：向无缓冲通道发送一个值 happens-before 从该通道接收到这个值。
4. **闭包外规则**：Go 程序中对 Goroutine 的启动 happens-before 这个 Goroutine 中的操作开始。

**示例分析**

```go
package main

import (
    "fmt"
    "sync"
)

var (
    mu    sync.Mutex
    value int
)

func writer(wg *sync.WaitGroup) {
    defer wg.Done()
    mu.Lock()
    value = 42
    mu.Unlock()
}

func reader(wg *sync.WaitGroup) {
    defer wg.Done()
    mu.Lock()
    defer mu.Unlock()
    fmt.Println(value)
}

func main() {
    var wg sync.WaitGroup

    wg.Add(2)
    go writer(&wg)
    go reader(&wg)

    wg.Wait()
}
```

在这个示例中，`writer` Goroutine 中的 `mu.Unlock()` happens-before `reader` Goroutine 中的 `mu.Lock()`，因此 `reader` 会看到 `value` 被设置为 `42`。

## 总结

理解 Go 的内存模型是编写并发安全程序的基础。通过使用同步原语如互斥锁、读写锁、原子操作和通道，可以确保 Goroutine 之间的内存操作是可预测和一致的。明确 "happens-before" 关系和遵循内存模型规则有助于避免竞态条件和其他并发问题。