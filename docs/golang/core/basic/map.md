---
order : 10
---

# 10. Map 集合

在 Go 语言中，map 是一种内置的数据结构，用于存储键值对。它是一种无序集合，提供了非常高效的查找、插入和删除操作。所以我们可以像迭代数组和切片那样迭代它。不过，Map 是无序的，遍历 Map 时返回的键值对的顺序是不确定的。





## 声明和初始化

Map 的声明语法如下所示

```go
var map [key]value
```

由于 Map 是 Golang 内置的数据结构，故可以使用 make 函数来创建 map 实例

```go
m := make(map[string]int)

// 也可使用字面量进行初始化
m := map[string]int{
    "Alice": 25,
    "Bob":   30,
}
```

## 操作map

**查询**

仅获取对应键的值

```go
bob := m["Bob"]
```

获取对应键的值，并且判断键是否存在

```go
age, exists := m["David"]
if exists {
    fmt.Println("David's age is", age)
} else {
    fmt.Println("David is not in the map")
}
```

::: important 在获取 Map 的值时，如果键不存在，返回该类型的零值，例如 int 类型的零值是 0，string 类型的零值是 ""。
:::

**插入或更新**

插入和更新操作是相同的，它首先会去更新，如果不存在则插入。

```go
m["height"] = 180
```


**删除**

使用 delete 函数来删除指定的键值对

```go
delete(m, "Bob")
```

**获取map长度**

使用 len 函数来获取 map 集合的长度，该长度为键值对的个数

```go
mapLen := len(m)
```

**遍历**

```go
for name, age := range m {
    fmt.Printf("%s is %d years old\n", name, age)
}
```

**作为参数传递**

Map 是引用类型，如果将一个 Map 传递给一个函数或赋值给另一个变量，它们都指向同一个底层数据结构，因此对 Map 的修改会影响到所有引用它的变量。


::: tip map 的特性
1. **无序**：`map` 中的键值对是无序的，遍历时的顺序不一定与插入顺序相同。
2. **键的类型**：`map` 的键可以是任何支持 `==` 和 `!=` 操作的类型，如布尔型、数字、字符串、指针、接口类型（只要动态类型支持 `==`）、结构体（只要所有字段支持 `==`）等。切片、函数和包含切片的结构体不能作为键。
3. **值的类型**：`map` 的值可以是任何类型。
4. **零值**：`map` 的零值是 `nil`，未初始化的 `map` 不能直接存储键值对。
:::

## 并发安全

Go 中的 `map` 本身不是并发安全的。如果在多个 goroutine 中同时读写同一个 `map`，可能会导致数据竞态和程序崩溃。可以使用 `sync.Mutex` 或 `sync.RWMutex` 来保护 `map` 的并发访问，或者使用 `sync.Map`，它是一个并发安全的 `map` 实现：

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var m sync.Map

    // 存储值
    m.Store("Alice", 25)
    m.Store("Bob", 30)

    // 加载值
    age, ok := m.Load("Alice")
    if ok {
        fmt.Println("Alice's age:", age)
    }

    // 遍历
    m.Range(func(key, value interface{}) bool {
        fmt.Printf("%s is %d years old\n", key, value)
        return true
    })
}
```

## 特殊情况NaN

这里要注意一个特殊情况，`math.NaN()` 并不是一个可比较的值，当其作为 key 时，因为 NaN（Not-a-Number） 与任何值（包括它自己）比较都不相等。

使用 `math.NaN()` 作为 `map` 的键会导致不可预测的行为，或者编译时错误。以下是一个示例，展示为什么不能使用 `math.NaN()` 作为 `map` 的键：

**示例**

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	m := make(map[float64]string)

	// 尝试使用 NaN 作为键
	nan := math.NaN()
	m[nan] = "Not-a-Number"

	// 检查 NaN 是否在 map 中
	val, exists := m[nan]
	fmt.Printf("Key exists: %v, Value: %v\n", exists, val)

	// 尝试使用另外一个 NaN 作为键来获取值
	anotherNaN := math.NaN()
	val, exists = m[anotherNaN]
	fmt.Printf("Another key exists: %v, Value: %v\n", exists, val)
}
```

**输出**

```plaintext
Key exists: true, Value: Not-a-Number
Another key exists: false, Value: 
```

这个示例展示了以下几点：

1. 即使在 `map` 中插入了一个键 `nan`，查找时依然无法找到它，因为 NaN 不等于任何值（包括它自己）。
2. `exists` 会返回 `false`，因为 `anotherNaN` 不等于 `nan`，即使它们都是 NaN。

**解决方案**

为了避免这种情况，不要使用 NaN 作为 `map` 的键。如果你有一个包含 NaN 的数据集，需要对其进行查找操作，考虑使用其他数据结构或转换策略来处理这些值。 

**其他可比较类型的键**

在 Go 中，可以作为 `map` 键的类型包括：
- 基本类型：`int`, `float64`, `string`, `bool`
- 结构体类型（如果它们的所有字段都是可比较的类型）
- 指针类型
- 自定义类型（如果它们支持比较操作）
