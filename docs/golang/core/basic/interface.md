---
order : 11
---

# 11. 接口

在 Golang 中，接口（interface）是一种定义对象行为的方式，它是方法集合的抽象表示。接口定义了对象可以响应的方法集合，而不关心具体实现，以及实现接口的类型。这种特性使得接口在 Golang 中非常强大和灵活，有助于实现面向对象编程的抽象和多态。

## 接口定义

接口定义使用 `type` 关键字和 `interface` 关键字，例如：

```go
type Shape interface {
    Area() float64
    Perimeter() float64
}
```

上面的例子定义了一个`Shape`接口，它要求实现该接口的类型必须实现`Area()`和`Perimeter()`方法，这两个方法返回浮点数类型。

## 接口实现

任何类型只要实现了接口定义的所有方法，就隐式地实现了该接口。例如，定义一个`Rectangle`结构体实现`Shape`接口：

```go
type Rectangle struct {
    width, height float64
}

func (r Rectangle) Area() float64 {
    return r.width * r.height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.width + r.height)
}
```

这里，`Rectangle`结构体实现了`Shape`接口的`Area()`和`Perimeter()`方法，因此`Rectangle`类型就可以被赋值给`Shape`接口变量。

::: important 在 Golang 中没有明确的继承和实现，只要你实现了接口中定义的所有方法，就相当于你实现了该接口，即可使用多态，将该类型的值赋值给接口类型的变量。
:::

## 接口变量

接口变量可以存储任何实现了接口的类型的值。例如，可以将`Rectangle`类型的变量赋值给`Shape`接口变量：

```go
var s Shape
s = Rectangle{width: 3, height: 4}
```

## 空接口

在Go语言中，空接口 `interface{}` 不包含任何方法，因此所有类型都实现了空接口，类似与 Java 中的一切对象继承自 `Object`。空接口对于需要处理未知类型的数据非常有用，例如函数参数或者存储任意类型的数据：

```go
func describe(i interface{}) {
    fmt.Printf("(%v, %T)\n", i, i)
}

describe(42)
describe("hello")
describe(true)
```

## 接口断言

接口变量可以通过类型断言来获取其底层具体类型的值。例如：

```go
r := s.(Rectangle)
fmt.Println("Width:", r.width, "Height:", r.height)
```

需要注意的是，如果类型断言失败，会引发运行时恐慌。因此，为了安全地检查接口变量是否可以转换为特定类型，可以使用带有两个返回值的类型断言，如：

```go
r, ok := s.(Rectangle)
if ok {
    fmt.Println("Width:", r.width, "Height:", r.height)
} else {
    fmt.Println("Assertion failed")
}
```

## 接口组合

接口可以通过组合多个接口来定义新的接口：

```go
type Writer interface {
    Write([]byte) (int, error)
}

type Closer interface {
    Close() error
}

type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}
```

这种方式可以创建更加具体的接口，以便在不同的场景中使用。

接口是Go语言中实现多态和抽象的关键机制之一，通过接口，可以实现更加灵活和可扩展的代码结构。