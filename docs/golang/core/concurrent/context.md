---
order : 6
---

# 6. Context 上下文

在 Go 语言中，`context` 包提供了一种用于在 API 边界上传递请求范围数据、取消信号和截止日期的方式。`context` 包主要用于在不同的 Goroutine 之间共享上下文信息，常用于处理请求生命周期管理、超时控制、取消信号传递等场景。下面是一些常见的用法示例以及详细解释。

## 基本用法

### 创建上下文

有几种方式可以创建一个上下文对象：

1. `context.Background()`：返回一个空的上下文，通常在程序的主函数、初始化、测试中使用。
2. `context.TODO()`：返回一个空的上下文，表示还没有明确的上下文要使用，通常用于暂时替代位置。

```go
ctx := context.Background()
```

### 传递上下文

上下文对象通常作为函数的第一个参数进行传递。

```go
func DoSomething(ctx context.Context) {
    // 函数体
}

func main() {
    ctx := context.Background()
    DoSomething(ctx)
}
```

### 取消上下文

可以使用 `context.WithCancel` 创建一个可以取消的上下文。当调用返回的取消函数时，所有派生自该上下文的操作都会收到取消信号。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func doWork(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Work cancelled")
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())

    go doWork(ctx)

    time.Sleep(2 * time.Second)
    cancel() // 取消上下文
    time.Sleep(1 * time.Second)
}
```

### 超时上下文

使用 `context.WithTimeout` 可以创建一个带有超时的上下文。当超时时间到达时，操作会自动取消。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func doWork(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Work timed out")
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    go doWork(ctx)

    time.Sleep(3 * time.Second)
}
```

### 截止时间上下文

使用 `context.WithDeadline` 可以创建一个带有截止时间的上下文，与 `WithTimeout` 类似，但可以指定具体的时间点。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func doWork(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Work deadline reached")
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    deadline := time.Now().Add(2 * time.Second)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    go doWork(ctx)

    time.Sleep(3 * time.Second)
}
```

### 带值上下文

使用 `context.WithValue` 可以在上下文中存储键值对数据，适用于跨 API 边界传递请求范围的数据。

```go
package main

import (
    "context"
    "fmt"
)

func doWork(ctx context.Context) {
    key := "myKey"
    if value, ok := ctx.Value(key).(string); ok {
        fmt.Println("Value from context:", value)
    } else {
        fmt.Println("Key not found in context")
    }
}

func main() {
    ctx := context.WithValue(context.Background(), "myKey", "myValue")

    doWork(ctx)
}
```

**综合示例**

下面是一个综合示例，展示了如何使用取消、超时和带值的上下文。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func doWork(ctx context.Context) {
    key := "taskID"
    if taskID, ok := ctx.Value(key).(string); ok {
        fmt.Printf("Started task with ID: %s\n", taskID)
    }

    for {
        select {
        case <-ctx.Done():
            fmt.Println("Work cancelled or timed out")
            return
        default:
            fmt.Println("Working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    // 创建一个带有超时的上下文
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    // 在上下文中添加值
    ctx = context.WithValue(ctx, "taskID", "1234")

    go doWork(ctx)

    time.Sleep(3 * time.Second)
}
```

## 总结

在 Go 语言中，`context` 包提供了一种简洁而强大的方式来管理并发程序中的请求范围数据、取消信号和截止日期。通过正确地使用 `context`，可以更好地控制 Goroutine 的生命周期，避免资源泄漏，提高代码的可读性和维护性。