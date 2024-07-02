---
order : 6
---

# 6. 函数方法

在 Golang 中函数是对代码封装和重用的基本形式，与 Java 、C/C++ 不同的是，Golang 中的函数功能似乎更加强大，不仅可以当做代码的封装，还可以当做变量，也可以作为参数进行传递。

以下是 Golang 函数的定义、调用、参数、返回值、匿名函数、闭包等方面的详细说明：

Golang 中的函数是代码重用和逻辑封装的基本构造。以下是 Golang 函数的定义、调用、参数、返回值、匿名函数、闭包等方面的详细说明：

## 函数

### 1. 函数定义与调用

函数定义使用 func 关键字，具体如下：

```go
// 函数定义
func add(a int, b int) int {
    return a + b
}

// 函数调用
result := add(2, 3) // result == 5
```

- `add` : 函数名称
- `(a int, b int )`：参数列表
- `int` : 返回值类型


### 2. 参数与返回值

- **多参数函数**：可以定义多个参数，参数类型可以相同或不同。

```go
func multiply(x int, y int) int {
    return x * y
}
```

- **多返回值函数**：函数可以返回多个值。

```go
func divide(x, y int) (int, int) {
    return x / y, x % y
}
quotient, remainder := divide(10, 3) // quotient == 3, remainder == 1
```

::: note 这和 Java 等语言中函数只能返回一个值不同。
:::

- **命名返回值**：可以为返回值命名，使得返回值在函数体内被赋值时无需显示 `return`。

```go
func rectangleArea(width, height int) (area int) {
    area = width * height
    return  // 可直接隐藏，可用于控制逻辑执行
}
```

::: tip 这里可以看做是在函数调用之前就初始化好了返回值变量，故这里不必定义可直接使用。
:::

### 3. 可变参数函数

- **可变参数**：函数可以接收变长参数列表。

```go
func sum(nums ...int) int {
    total := 0
    for _, num := range nums {
        total += num
    }
    return total
}
total := sum(1, 2, 3, 4) // total == 10
```

### 4. 匿名函数

- **匿名函数**：函数可以是匿名的，并且可以赋值给变量或作为参数传递。

```go
add := func(a, b int) int {
    return a + b
}
result := add(3, 4) // result == 7
```

### 5. 闭包

- **闭包**：匿名函数可以访问其外层作用域中的变量，即使这些变量不在其参数列表中。

```go
func makeMultiplier(factor int) func(int) int {
    return func(x int) int {
        return x * factor
    }
}
double := makeMultiplier(2)
result := double(5) // result == 10
```

::: important 匿名函数和闭包有啥区别？

**区别**

- 匿名函数是指没有名称的函数，可以被直接调用或者作为值传递给其他函数。
- 闭包是指一个函数值，可以访问其定义时外部作用域中的变量，即使在定义时所在的作用域已经不存在，这些变量仍然可以被访问和操作。

**使用场景**

- 使用匿名函数可以简化代码结构，将一些逻辑封装成临时使用的函数。
- 使用闭包可以实现状态的保持和管理，特别适合需要持久化状态或者捕获动态变化的场景。

:::

### 6. 递归函数

- **递归**：函数可以调用自身来解决问题。但需要明确出退出条件，否则会无限递归，导致栈溢出。

```go
func factorial(n int) int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n-1)
}
result := factorial(5) // result == 120
```

### 7. 函数作为参数和返回值

- **函数作为参数**：函数可以作为参数传递给其他函数。

```go
func apply(fn func(int, int) int, a int, b int) int {
    return fn(a, b)
}
result := apply(add, 5, 6) // result == 11
```

- **函数作为返回值**：函数可以返回另一个函数。

```go
func makeAdder(x int) func(int) int {
    return func(y int) int {
        return x + y
    }
}
add5 := makeAdder(5)
result := add5(3) // result == 8
```



### 8. 延迟执行 (`defer`)

- **延迟执行**：`defer` 语句可以延迟函数或方法的执行直到封闭函数返回。

```go
func main() {
    defer fmt.Println("World")
    fmt.Println("Hello")
}
// Output:
// Hello
// World
```

::: important 多个 Defer 调用根据后进先出的顺序执行，类似于栈。
:::

### 9. 错误处理

- **错误处理**：通过返回值和内置的 `error` 类型进行错误处理。

```go
func divide(x, y int) (int, error) {
    if y == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return x / y, nil
}

result, err := divide(10, 0)
if err != nil {
    fmt.Println("Error:", err)
}
```

## 方法

方法是定义在类型上的函数，在 Golang 中方法与函数的区别在于，方法拥有接收者，而函数没有，且只有自定义类型能够拥有方法。

```go
type Rectangle struct {
    width, height int
}

func (r Rectangle) Area() int {
    return r.width * r.height
}

rect := Rectangle{10, 5}
area := rect.Area() // area == 50
```

这个案例中大体上和函数基本类似，只在函数名前面多了 `(r Rectangle)`，这定义了方法的接收者为 r，Rectangle 就是方法的接收者类型，说明方法属于该接收者，调用时需要使用到该接收者。

方法的接收者分为 `值接收者` 和 `指针接收者` 两种类型

**值接收者**

```go
type MyInt int

func (m MyInt) Double() {
    m = m * 2
}

func main() {
    var x MyInt = 10
    var y int = int(x)   // 将 MyInt 的值转换为 int
    fmt.Println("初始 x 的值为: ", y) // 输出: 初始 x 的值为: 10

    x.Double()
    var z int = int(x)   // 将 MyInt 的值转换为 int
    fmt.Println("成倍后 x 的值为: ", z) // 输出: 成倍后 x 的值为: 10
}
```

这里调用了 Double 方法，是将 MyInt 类型的 x 变成两倍，但是实际的输出是：

```text
初始 x 的值为:  10
成倍后 x 的值为:  10
```

并没有达到成倍的效果，这是因为这里方法的接收者是值，在方法被调用时，会将接收者的值传入方法中，可以类似的看为形参，在方法内修改形参的值，并不会对方法外面的值进行改变。

如果要是通过指针调用会如何呢？

```go
func main() {
    var x MyInt = 10
    var y int = int(x)   // 将 MyInt 的值转换为 int
    fmt.Println("初始 x 的值为: ", y) // 输出: 初始 x 的值为: 10

    (&x).Double()
    var z int = int(x)   // 将 MyInt 的值转换为 int
    fmt.Println("成倍后 x 的值为: ", z) // 输出: 成倍后 x 的值为: 10
}
```

事实上，输出的仍然是上述结果，这是因为为了能够和接收者类型进行匹配，Golang 自行进行进行了解引用操作，将 `(&x).Double()` 解析为`(*(&x)).Double()` ，以便于匹配 `(m MyInt)` 的接收者类型。


**指针接收者**

将上述代码进行修改，将值接收者变为指针接收者

```go
type MyInt int

func (m *MyInt) Double() {
    *m = *m * 2
}

func main() {
    var x MyInt = 10
    var y int = int(x)   // 将 MyInt 的值转换为 int
    fmt.Println("初始 x 的值为: ", y) // 输出: 初始 x 的值为: 10

    x.Double()
    var z int = int(x)   // 将 MyInt 的值转换为 int
    fmt.Println("成倍后 x 的值为: ", z) // 输出: 成倍后 x 的值为: 20
}
```

执行后的结果为：

```text
初始 x 的值为:  10
成倍后 x 的值为:  20
```

此时成功的修改了 x 的值，此时即便我们没有使用指针调用，依然能够修改成功，这也是因为 Golang 为了成功匹配接收者的类型，帮我们做了引用，将 `x.Double()` 转换为了 `(&x).Double()`，故方法的接收者为指针时，不管调用者是不是指针，都可以修改内部的值。

函数参数的传递过程中，是值拷贝，也就是将原来的值复制一份传递，故修改形参时，不会影响原有的值。传递指针时，也是将指针的内容复制一份传递，但是由于两个指针所指向的是同一个地址，此时再通过该指针来修改形参，也会造成原值的变化，从而实现了原值的修改。

::: warning 了解到这些之后，可以思考切片这种类型做为参数传递，是否会修改原值？
答案是：会修改原值。原因如下：在前面 数据类型的小节中，说明了切片这种数据类型底层实际上存储了指向切片的指针，对切片的操作是通过该指针来进行的，故在修改形参后，对应的也会造成原值的改变。

和 Java 中不同的是，Golang 中的数组是直接存储在内存中的值，作为参数传递时会传递数组的副本，修改形参并不会对原值曹成变化，但是 Java 中是通过引用传递数组的，故会修改原值。
:::

::: important 方法和函数的区别
方法和函数的却别，类似于 Java 中的 `类方法` 和 `对象方法`，即函数的归属不同。

在 Golang 中接收者不能直接调用属于包的函数，只能直接调用自身绑定的方法，但是可以在这些方法的内部实现中访问包中的函数。
:::

## 访问控制

**Golang 中的访问控制是通过其名称的第一个首字母进行区分的：**

- 大写字母开头：导出（exported），可以被其他包访问。
- 小写字母开头：未导出（unexported），仅在包内可见。

这种约定适用于 Go 的所有标识符，包括变量、常量、函数、类型（结构体、接口等）、字段和方法。


**Golang 的访问控制机制简化了代码结构，主要关注于包级别的访问限制。设计理念主要有以下几个方面：**

- 明确性：通过首字母大小写，访问控制一目了然。
- 简洁性：避免了复杂的访问控制规则。
- 包为单位：所有访问控制以包为基本单位，有助于实现良好的包封装

::: warning 如果想访问其内部的数据，可借助辅助函数或者接口
1. 辅助函数：可以定义类似于 Get、Set 类似的辅助函数，从而实现对没有权限的数据的访问。

2. 接口：虽然结构体字段可以是未导出的，但如果字段实现了某个接口的方法，并且该接口是导出的，依然可以通过接口访问其功能。
:::

这些是 Golang 函数的主要特性和用法示例，每个特性提供了强大的工具来处理函数的定义、调用、参数传递、返回值以及高级用法。在实际的开发中，函数是最高频被使用到的技术点，需要熟练掌握。