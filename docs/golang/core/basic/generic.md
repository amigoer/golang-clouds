---
order : 12
headerDepth : 1
---

# 12. 泛型

Go语言在1.18版本引入了泛型，使得函数和数据结构可以处理任意类型的数据，而不需要为每种类型编写单独的代码。泛型通过类型参数和类型约束实现，这大大增强了Go语言的灵活性和可重用性。

## 开始之前

在正式了解泛型之前先看一个经常在开发中遇到的问题，求两数之和

```go
func sum(a int,b int) int{
    return a + b
}
```
::: warning 该函数可以求两个整数的和，那么要是求两个浮点数的和呢？很简单，再写一个函数不就行了吗？
:::
```go
func sum(a float32,b float32) float32{
    return a + b
}
```
没错，再写一个函数确实可以实现这个需求，那么再加一些需求，要求 `int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64` 这些类型的和呢？也对每一个类型都写一个求和函数吗？

确实，这样是可以实现，但是不难发现，实际上的实现逻辑都是相同的，只是数据类型不同，要是能将数据类型变成一个变量传进来，根据传进来的变量动态的控制数据类型，不就可以了吗？

::: tip 很好，这个传进来的数据类型的变量，就是泛型。
:::
## 泛型函数

一个简单的泛型函数定义如下：

```go
func Print[T any](s []T) {
    for _, v := range s {
        fmt.Println(v)
    }
}
```

这里的 `T` 是一个类型参数，`any` 是一个预定义的接口，表示任意类型。这个函数可以接受任何类型的切片作为参数：

```go
ints := []int{1, 2, 3}
strings := []string{"a", "b", "c"}

Print(ints)
Print(strings)
```

## 泛型类型

泛型不仅可以用于函数，还可以用于定义数据结构，例如泛型列表：

```go
type List[T any] struct {
    items []T
}

func (l *List[T]) Add(item T) {
    l.items = append(l.items, item)
}

func (l *List[T]) Get(index int) T {
    return l.items[index]
}
```

这样就可以创建不同类型的列表，而不需要重复代码：

```go
intList := List[int]{}
intList.Add(1)
intList.Add(2)
fmt.Println(intList.Get(0)) // 输出 1

stringList := List[string]{}
stringList.Add("a")
stringList.Add("b")
fmt.Println(stringList.Get(0)) // 输出 a
```

## 类型约束

类型参数可以有约束条件，使得泛型函数或类型只能接受特定类型。例如，只接受可比较的类型：

```go
type Comparable interface {
    comparable
}

func Max[T Comparable](a, b T) T {
    if a > b {
        return a
    }
    return b
}
```

使用 `comparable` 约束，`Max` 函数只能用于可比较的类型（即实现了`==`和`!=`操作的类型）：

```go
fmt.Println(Max(3, 5))       // 输出 5
fmt.Println(Max("a", "b"))   // 输出 b
```

### 多个类型参数

泛型函数和类型可以有多个类型参数：

```go
func Map[K comparable, V any](m map[K]V) []K {
    keys := make([]K, 0, len(m))
    for k := range m {
        keys = append(keys, k)
    }
    return keys
}

m := map[string]int{"one": 1, "two": 2, "three": 3}
keys := Map(m)
fmt.Println(keys) // 输出 [one two three]（顺序可能不同）
```

## 使用约束定义接口

你可以使用类型约束来定义接口，以便限制泛型类型的使用范围。例如，定义一个接口`Number`，它限制类型参数必须是数值类型：

```go
type Number interface {
    int | int32 | int64 | float32 | float64
}

func Sum[T Number](s []T) T {
    var sum T
    for _, v := range s {
        sum += v
    }
    return sum
}

ints := []int{1, 2, 3, 4, 5}
floats := []float64{1.1, 2.2, 3.3}

fmt.Println(Sum(ints))    // 输出 15
fmt.Println(Sum(floats))  // 输出 6.6
```

## 泛型的优势

- **代码复用**：泛型允许编写通用函数和数据结构，而无需针对每种类型编写特定的实现。
- **类型安全**：相比于使用空接口（`interface{}`），泛型提供了编译时的类型检查，减少了运行时错误。
- **简化代码**：减少了重复代码，使代码更简洁、更易读。

通过泛型，Go语言可以更灵活地处理各种数据类型，进一步增强了代码的可重用性和可维护性。