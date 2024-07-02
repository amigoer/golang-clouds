---
order : 5
---

# 5. 逻辑控制语句

## If 语句


if 语句是编程语言中最为基础也是最重要的一个逻辑控制语句，以下是几种 if 语句的具体用法。

-  if 语句

```go
if condition {
    // condition 为 true 时执行的语句
}
```

-  if ... else 语句

```go
if condition {
    // condition 为 true 时执行的语句
} else {
    // condition 为 false 时执行的语句
}
```

-  if ... else if ... else 语句

```go
if condition1 {
    // condition1 为 true 时执行的语句
} else if condition2 {
    // condition2 为 true 时执行的语句
} else {
    // condition1 和 condition2 都为 false 时执行的语句
}
```


::: note if 语句可以嵌套使用，以满足实际需求
:::

## Switch 语句

Switah 语句用于进行多分支条件判断，替代多个 if ... else 结构，使代码更加简洁和易读。

```go
switch expression {
case value1:
    // 当 expression 等于 value1 时执行的代码块
case value2:
    // 当 expression 等于 value2 时执行的代码块
default:
    // 当所有 case 都不匹配时执行的代码块（可选）
}
```

**特点与注意事项**

1. 无需使用 break 语句：Go 的 switch 语句在匹配到某个 case 后会自动跳出 switch 块，不需要像 C/C++ 或者 Java 中那样显式使用 break 来终止 case。

2. 多个匹配条件：可以在同一个 case 分支中指定多个匹配条件，用逗号分隔：

```go
switch day {
case "Saturday", "Sunday":
    fmt.Println("Weekend")
default:
    fmt.Println("Weekday")
}
```

3. 空 switch 语句：如果 switch 关键字后没有表达式，那么它将作为一个 true 开关，可以用于条件逻辑：


```go
switch {
case x > 0:
    fmt.Println("x is positive")
case x < 0:
    fmt.Println("x is negative")
default:
    fmt.Println("x is zero")
}
```


4. 带初始化语句的 switch：可以在 switch 语句中初始化一个变量，该变量的作用域仅限于 switch 内部：

```go
switch x := getValue(); x {
case 1:
    fmt.Println("x is 1")
case 2:
    fmt.Println("x is 2")
default:
    fmt.Println("x is neither 1 nor 2")
}
```

5. 类型开关：switch 语句还可以用于类型断言，以便处理接口类型的不同实现：

```go
var i interface{} = "hello"

switch v := i.(type) {
case int:
    fmt.Println("i is an int")
case string:
    fmt.Println("i is a string")
default:
    fmt.Printf("i is of unknown type %T\n", v)
}
```

在这个例子中，v 被分配为 i 的类型断言结果，并根据 v 的类型选择不同的 case。

::: tip Switch 适用于同一变量的多种条件，能够使得代码逻辑更加清晰，方便维护。
:::

## For 语句

For 循环是一种常见的控制流结构，用于重复执行一段代码块，直到指定的条件不再满足为止。与其他编程语言不同，Golang 中没有提供 While 语句，但可以使用 Golang 来实现同样的效果。

**基本语法**

Go 中的 `for` 循环有三种基本形式：

1. **基本的 `for` 循环：**

```go
for initialization; condition; post {
    // 循环体
}
```

- `initialization`：循环开始前执行的初始化语句，通常是变量声明或赋值。
- `condition`：循环的条件判断表达式，当条件为 `false` 时退出循环。
- `post`：每次循环迭代后执行的操作，通常是更新变量的语句。

示例：

```go
package main

import "fmt"

func main() {
    for i := 1; i <= 5; i++ {
        fmt.Println(i)
    }
}
```

上述代码将输出从 1 到 5 的数字。

2. **类似于 `while` 的循环：**

Go 中没有 `while` 循环，但可以通过 `for` 循环模拟 `while` 循环：

```go
for condition {
    // 循环体
}
```

示例：

```go
package main

import "fmt"

func main() {
    sum := 0
    for sum < 10 {
        sum += 2
        fmt.Println(sum)
    }
}
```

上述代码会输出 2、4、6、8、10，直到 `sum` 的值不再小于 10。

3. **无限循环：**

可以使用空的 `for` 循环来实现无限循环：

```go
for {
    // 无限循环体
}
```

示例：

```go
package main

import "fmt"

func main() {
    count := 0
    for {
        count++
        if count > 5 {
            break
        }
        fmt.Println("Count:", count)
    }
}
```

上述代码将输出 `Count: 1` 到 `Count: 5`，然后退出循环。

4. `for range` 循环

Go 还提供了一种特殊的 `for range` 循环，用于迭代数组、切片、字符串、映射等数据结构：

```go
for index, value := range collection {
    // 使用 index 和 value 进行操作
}
```

示例：

```go
package main

import "fmt"

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    for index, value := range numbers {
        fmt.Printf("Index: %d, Value: %d\n", index, value)
    }
}
```

这段代码会输出数组 `numbers` 中每个元素的索引和值。

::: warning 注意事项

- Go 中的 `for` 循环的三个部分 `initialization`、`condition` 和 `post` 都是可选的。
- `for` 循环没有括号 `{}` 之外的条件表达式，循环体必须用大括号 `{}` 括起来，即使只有一行代码。
:::


## Select 语句

在 Go 语言中，`select` 语句用于处理并发操作，特别是用于从多个通信通道中选择和执行不同的 `case`。以下是关于 `select` 语句在 Go 中的详细解释和用法说明：

**1. 基本语法**

`select` 语句类似于 `switch` 语句，但用于通信操作：

```go
select {
case communicationCase1:
    // 处理通信1的逻辑
case communicationCase2:
    // 处理通信2的逻辑
default:
    // 当没有任何通信情况发生时执行的逻辑（可选）
}
```

- `case communicationCase1:`：每个 `case` 都描述了一个通信操作，它可以是 `channel` 的发送或接收操作。
- `default:`：`default` 分支在所有 `case` 都不满足时执行，它是可选的。

**2. 示例**

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(2 * time.Second)
        ch1 <- "message from ch1"
    }()

    go func() {
        time.Sleep(1 * time.Second)
        ch2 <- "message from ch2"
    }()

    select {
    case msg1 := <-ch1:
        fmt.Println("Received", msg1)
    case msg2 := <-ch2:
        fmt.Println("Received", msg2)
    default:
        fmt.Println("No communication")
    }
}
```

在这个示例中，`select` 语句会等待并接收来自 `ch1` 和 `ch2` 通道的消息，并打印出第一个准备好的消息。由于 `ch2` 的消息比 `ch1` 的消息先准备好，因此输出结果会是 `"Received message from ch2"`。

**3. 特点与注意事项**

- `select` 语句在每次执行时，都会随机选择一个满足条件的 `case` 执行。如果多个 `case` 同时准备好，Go 会随机选择其中之一。
- 如果没有任何 `case` 准备好，并且存在 `default` 分支，则会执行 `default` 分支的代码。
- `select` 语句可以和 `for` 循环结合使用，实现不断地监听多个通道的消息。
- `select` 中的 `case` 可以是发送操作、接收操作或者仅仅是用于阻塞当前 `goroutine` 的操作。

**4. 使用场景**

- **多路复用通信**：当需要从多个通道中接收消息时，`select` 是一个非常有用的工具，可以有效地管理并发通信。
- **超时控制**：结合 `time.After()` 和 `select` 可以实现超时控制，例如在一定时间内等待某个操作完成或者超时返回默认结果。

**5. 总结**

`select` 语句是 Go 语言中处理并发编程的重要工具之一，通过选择和处理多个通道中的消息，可以简化并发程序的编写和管理。了解并熟练使用 `select` 可以提升代码的可读性和性能。

::: important 上述的所有逻辑控制语句均可嵌套使用，从而达到流程控制的作用。这几个语句最为重要，也必须熟练掌握。
:::