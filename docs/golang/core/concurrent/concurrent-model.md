---
order : 5
---

# 5. 并发模式

并发模式是指在并发编程中常用的设计模式和方法，用于有效地管理和协调多个并发任务。以下是一些常见的并发模式，结合 Go 语言的示例代码来介绍它们的应用。

## 1. 工作池（Worker Pool）

工作池模式通过一组固定数量的工作 Goroutine 来处理大量的任务，避免因为过多的 Goroutine 而导致资源的过度消耗。

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Worker 函数，模拟处理任务
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("Worker %d started job %d\n", id, j)
        time.Sleep(time.Second) // 模拟工作
        fmt.Printf("Worker %d finished job %d\n", id, j)
        results <- j * 2 // 返回结果
    }
}

func main() {
    const numJobs = 5
    const numWorkers = 3

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)

    var wg sync.WaitGroup

    // 启动 worker Goroutine
    for w := 1; w <= numWorkers; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    // 发送任务到 jobs 通道
    for j := 1; j <= numJobs; j++ {
        jobs <- j
    }
    close(jobs)

    // 等待所有 worker 完成
    wg.Wait()
    close(results)

    // 打印结果
    for result := range results {
        fmt.Println("Result:", result)
    }
}
```

## 2. 扇入（Fan-in）

扇入模式将多个输入通道合并到一个通道，从而可以在单个 Goroutine 中处理来自多个来源的数据。

```go
package main

import (
    "fmt"
    "time"
)

// generator 生成一系列数据并发送到通道
func generator(start int, end int, c chan<- int) {
    for i := start; i <= end; i++ {
        c <- i
        time.Sleep(time.Millisecond * 500) // 模拟延迟
    }
    close(c)
}

// fanIn 将多个通道合并为一个通道
func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup

    output := func(c <-chan int) {
        for n := range c {
            out <- n
        }
        wg.Done()
    }

    for _, c := range channels {
        wg.Add(1)
        go output(c)
    }

    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}

func main() {
    c1 := make(chan int)
    c2 := make(chan int)
    
    go generator(1, 5, c1)
    go generator(6, 10, c2)

    for n := range fanIn(c1, c2) {
        fmt.Println(n)
    }
}
```

## 3. 扇出（Fan-out）

扇出模式将一个输入通道的数据分发到多个 Goroutine 进行并行处理。

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// worker 函数处理来自 jobs 通道的任务
func worker(id int, jobs <-chan int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, j)
        time.Sleep(time.Second) // 模拟工作
    }
}

func main() {
    jobs := make(chan int, 10)
    var wg sync.WaitGroup

    // 启动 worker Goroutine
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, &wg)
    }

    // 发送任务到 jobs 通道
    for j := 1; j <= 10; j++ {
        jobs <- j
    }
    close(jobs)

    // 等待所有 worker 完成
    wg.Wait()
}
```

## 4. 管道（Pipeline）

管道模式将任务分解为一系列的处理步骤，每个步骤由一个 Goroutine 处理，并将结果传递到下一个步骤的 Goroutine。

```go
package main

import (
    "fmt"
    "time"
)

// 生成器生成一系列数字
func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

// 阶段1：数字加倍
func doubler(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * 2
        }
        close(out)
    }()
    return out
}

// 阶段2：数字平方
func squarer(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func main() {
    // 生成数据并通过管道传递
    nums := generator(1, 2, 3, 4, 5)
    doubled := doubler(nums)
    squared := squarer(doubled)

    // 打印结果
    for n := range squared {
        fmt.Println(n)
    }
}
```

## 5. 多路复用（Multiplexing）

多路复用模式通过 `select` 语句从多个通道中选择可用的通道进行处理。

```go
package main

import (
    "fmt"
    "time"
)

// 生成器函数生成数据并发送到通道
func generator(name string, interval time.Duration) <-chan string {
    c := make(chan string)
    go func() {
        for i := 1; ; i++ {
            c <- fmt.Sprintf("%s: %d", name, i)
            time.Sleep(interval)
        }
    }()
    return c
}

func main() {
    c1 := generator("Channel 1", 2*time.Second)
    c2 := generator("Channel 2", 3*time.Second)

    for i := 0; i < 5; i++ {
        select {
        case msg1 := <-c1:
            fmt.Println(msg1)
        case msg2 := <-c2:
            fmt.Println(msg2)
        }
    }
}
```

## 6. 生产者-消费者（Producer-Consumer）

生产者-消费者模式通过缓冲通道协调生产者和消费者的工作，确保数据的安全传递和处理。

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// 生产者函数生成数据并发送到通道
func producer(id int, jobs chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := 1; j <= 5; j++ {
        fmt.Printf("Producer %d producing job %d\n", id, j)
        jobs <- j
        time.Sleep(time.Millisecond * 500)
    }
}

// 消费者函数从通道接收数据并处理
func consumer(id int, jobs <-chan int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        fmt.Printf("Consumer %d processing job %d\n", id, j)
        time.Sleep(time.Second)
    }
}

func main() {
    jobs := make(chan int, 10)
    var wg sync.WaitGroup

    // 启动生产者 Goroutine
    for p := 1; p <= 2; p++ {
        wg.Add(1)
        go producer(p, jobs, &wg)
    }

    // 启动消费者 Goroutine
    for c := 1; c <= 2; c++ {
        wg.Add(1)
        go consumer(c, jobs, &wg)
    }

    // 等待所有生产者完成
    wg.Wait()
    close(jobs)
}
```

这些并发模式提供了一种结构化的方法来编写并发程序，通过合理使用这些模式，可以简化并发编程的复杂性，提高代码的可维护性和扩展性。