---
order : 9
headerDepth : 1
---
# 9. 结构体

在 Golang 中相同类型的数据可以使用数组或者切片来存储，Golang 中抛弃了类与继承，保留了结构体，那么不同类型的数据可通过结构体来进行存储和组织。

结构体是由一系列具有相同类型或不同类型的数据构成的数据集合。

## 声明结构体

结构体定义需要使用 type 和 struct 关键字。结构体中不仅可以使用 Golang 内置的数据类型，也可以使用结构体类型。

```go
type StructName struct {
    variableName1 dataType1
    variableName2 dataType2
    variableName3 dataType3
    variableName4 dataType4
    ......
}
```

如果有相同类型的字段，可以简化声明

```go
type StructName struct {
    variableName1,variableName2,variableName3 ... dataType
    variableName4 dataType1
}
```

::: important 结构体内部的字段名也遵循首字母大小写命名暴露的方式，在声明结构体内部的字段时，应避免其与方法名重复。
:::



## 创建结构体实例

与 Java 这种面向对象的语言不同，Golang 中没有构造方法的概念，以下是 Golang 中创建结构体实例的几种方式。

```go
// 定义一个结构体
type Person struct {
    Name string
    Age  int
}
```

1. 字面量直接实例化

```go
p1 := Person{ Name: "Alice", Age: 30 }
```

2. 字面量简写形式实例化

```go
p2 := Person{ "Bob", 25 }
```

::: warning 如果省略字段名，那么就必须要初始化所有字段，且必须按照声明的顺序初始化。否则就会产生歧义，语法简化的目的是为了在保证语义唯一的情况下尽可能简化。
:::

3. 使用 new 函数实例化

```go
p3 := new(Person)
p3.Name = "Charlie"
p3.Age = 35
```

::: info 这里只能使用 new 函数，不能使用 make 函数，两者的区别请参考 <a href="">「new 和 make 详解」</a>
:::

4. 使用取地址符号实例化

```go
p4 := &Person{  Name: "Dave", Age: 40 }
```

::: important 因为 Golang 中没有构造方法，所以可以定义一个工厂函数来创建对象。
```go:no-linu-numbers
func NewPerson() Person {
    person := new(Person)
    person.Name = "Golang Notes"
    person.Age = 18

    return person
}
```
:::

## 访问结构体成员

访问结构体成员时使用 `.` 操作符，语法如下：

```go
structName.fieldName
```

以本节中的 Person 结构体为例，如下所示：

```go
person := Person{ 
    Name: "Golang Notes",
    Age: 18 
}

// 访问结构体字段
fmt.Println(person.Name)  // 输出 ： Golang Notes
fmt.Println(person.Age)   // 输出 ： 18

// 修改结构体字段
person.Name = "Coder Mast"
fmt.Println(person.Name)  // 输出 ： Coder Mast
```

那么再来看下面的这个例子

```go
person := new(Person)
person.Name = "Golang Notes"
person.Age = 18 

// 或者下面这种形式
person := &Person{ 
    Name: "Golang Notes",
    Age: 18 
}

// 访问结构体字段
fmt.Println(person.Name)  // 输出 ： Golang Notes
fmt.Println(person.Age)   // 输出 ： 18

// 修改结构体字段
person.Name = "Coder Mast"
fmt.Println(person.Name)  // 输出 ： Coder Mast
```

在这个例子中，person 实际上是结构体指针，但是在访问结构体时没有进行解引用就可直接访问结构体内容，这是 Golang 提供的语法糖，在编译后会自动进行解引用，如 person.Name 会被解析为 (*person).Name，本质还是解引用，只不过是在编译阶段，不必我们手动实现。

## 结构体作为参数

和 Golang 内置的数据类型一样，结构体类型也能作为参数传递给函数。

**结构体值做参数**

```go
type Person struct {
    Name string
    Age  int
}

func readPerson(person Person) {
    fmt.Printf("Name : %s，Age : %d", person.Name, person.Age)
}

func changePerson(person Person) {
    person.Name = "Coder Mast"
    person.Age = 20
}

func main() {
    var person Person = Person{ Name: "Golang Notes", Age: 18 }

    readPerson(person)  // 输出：Name : Golang Notes，Age : 18

    changePerson()

    readPerson(person)  // 输出：Name : Golang Notes，Age : 18
}
```


**结构体指针做参数**

```go
type Person struct {
    Name string
    Age  int
}

func readPerson(person *Person) {
    fmt.Printf("Name : %s，Age : %d", person.Name, person.Age)
}

func changePerson(person *Person) {
    person.Name = "Coder Mast"
    person.Age = 20
}

func main() {
	person := new(Person)
	person.Name = "Golang Notes"
	person.Age = 18

    readPerson(person)  // 输出：Name : Golang Notes，Age : 18

    changePerson()

    readPerson(person)  // 输出：Name : Coder Mast，Age : 20
}
```

::: important 结构体做参数时，无论是传递指针结构体还是值结构体，都是传递对应的副本，但是由于指针的副本同样指向的是该结构体实例，故修改形参后能够对原数据造成改变，值结构体不能。
:::

## 结构体标签

在 Golang 中结构体标签是一种元数据，用于提供给反射等工具以获取结构体字段的额外信息。常见的包括 JSON序列化、数据库映射、XML映射等。

结构体标签的具体使用如下：

:::: details 结构体标签使用案例
```go
package main

import (
    "encoding/json"
    "fmt"
)

// 定义一个结构体，并使用 JSON 标签
type Person struct {
    Name   string `json:"name"`
    Age    int    `json:"age"`
    Email  string `json:"email,omitempty"` // omitempty 表示如果该字段为空，则在序列化时忽略它
    Ignore string `json:"-"`               // - 表示在序列化和反序列化时忽略该字段
}

func main() {
    p := Person{
        Name:  "Alice",
        Age:   30,
        Email: "",
        Ignore: "This will be ignored",
    }

    // 将结构体序列化为 JSON
    jsonData, err := json.Marshal(p)
    if err != nil {
        fmt.Println("Error marshalling JSON:", err)
        return
    }

    fmt.Println(string(jsonData)) // 输出: {"name":"Alice","age":30}

    // 将 JSON 反序列化为结构体
    jsonStr := `{"name":"Bob","age":25}`
    var p2 Person
    err = json.Unmarshal([]byte(jsonStr), &p2)
    if err != nil {
        fmt.Println("Error unmarshalling JSON:", err)
        return
    }

    fmt.Printf("%+v\n", p2) // 输出: {Name:Bob Age:25 Email: Ignore:}
}
```
::::
### 结构体标签解释

- `json:"name"`：表示在进行 JSON 序列化和反序列化时，使用 `name` 作为 JSON 键名。
- `json:"email,omitempty"`：`omitempty` 表示如果该字段的值为空（零值），则在序列化时忽略它。
- `json:"-"`：表示在进行 JSON 序列化和反序列化时忽略该字段。

### 其他常见标签

除了 JSON 标签外，还有其他常见的标签，例如：

- `bson`：用于 MongoDB 的 BSON 序列化。
- `gorm`：用于 GORM ORM 工具的数据库字段映射。
- `yaml`：用于 YAML 序列化和反序列化。

```go
type User struct {
    ID   int    `gorm:"primary_key"` // GORM 标签
    Name string `bson:"name"`        // BSON 标签
    Age  int    `yaml:"age"`         // YAML 标签
}
```

通过使用结构体标签，可以更方便地控制序列化和反序列化的行为，以及与数据库、YAML 等数据格式的映射。

## 空结构体

在 Golang 中，空结构体（empty struct）是一个没有任何字段的结构体。空结构体的声明如下：

```go
type EmptyStruct struct{}
```

空结构体通常用于以下几种场景：

1. **作为信号传递的占位符**：空结构体在信号传递、通知、标记等场景中使用，因为它不占用内存空间。
2. **集合数据结构中的占位符**：空结构体可以用作 map 的值，以节省内存。
3. **嵌入其他结构体中**：空结构体可以用于将方法注入到其他结构体中。


**使用空结构体作为信号传递的占位符**

在使用 channel 进行信号传递时，空结构体可以作为一种占位符，表示一个事件的发生，而不需要传递实际数据。

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    done := make(chan struct{}) // 创建一个空结构体的 channel

    go func() {
        fmt.Println("Goroutine started")
        time.Sleep(2 * time.Second)
        close(done) // 发送信号
    }()

    <-done // 接收信号
    fmt.Println("Goroutine finished")
}
```

**使用空结构体作为 map 的值**

空结构体可以用作 map 的值，用于构建集合数据结构。这种方式比使用其他占位符（如 `bool`）更节省内存。

```go
package main

import "fmt"

func main() {
    // 使用空结构体作为 map 的值
    mySet := make(map[string]struct{})

    // 添加元素
    mySet["apple"] = struct{}{}
    mySet["banana"] = struct{}{}

    // 检查元素是否存在
    if _, exists := mySet["apple"]; exists {
        fmt.Println("apple is in the set")
    }

    // 输出集合中的元素
    for key := range mySet {
        fmt.Println(key)
    }
}
```

**使用空结构体嵌入其他结构体中**

空结构体可以嵌入到其他结构体中，以便为其他结构体提供方法集合。

```go
package main

import "fmt"

type Logger struct{}

func (Logger) Log(message string) {
    fmt.Println("Log:", message)
}

type Server struct {
    Logger
}

func main() {
    server := Server{}
    server.Log("Server started") // 调用嵌入的 Logger 方法
}
```

**内存消耗**

空结构体不消耗任何内存空间，因为它不包含任何数据字段。这使得它非常适合作为信号或占位符使用。

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    var emptyStruct struct{}
    fmt.Println(unsafe.Sizeof(emptyStruct)) // 输出 0
}
```

综上所述，空结构体在 Golang 中是一个非常有用的工具，可以在多种场景中提高代码的效率和简洁性。

## 结构体的存储

在 Golang 中结构体在内存中的存储是按其字段在结构体中声明的顺序来排列的，每个字段都以适当的内存对齐方式存储，以确保内存访问的效率。具体来说：

1. **内存对齐**：为了提高内存访问效率，Go 会对结构体字段进行对齐。对齐意味着字段的起始地址必须是其类型大小的倍数。例如，`int32` 类型的字段必须对齐到 4 字节的边界，`int64` 类型的字段必须对齐到 8 字节的边界。

2. **填充和空洞**：为了满足对齐要求，Go 编译器可能会在字段之间插入一些填充字节。这些填充字节不存储任何有效数据，只是为了使下一个字段的起始地址满足对齐要求。这会导致结构体在内存中占用的空间比字段本身的大小总和更多。

::: tip 内存对齐实际上是一种用空间换时间的设计。它通过将内存划分成大小均匀的小块，从而提高处理器访问内存的效率。这种设计有助于减少访问内存时的性能开销，从而提高系统整体的性能。
:::

:::: details 示例和内存布局

考虑以下结构体：

```go
package main

import (
	"fmt"
	"unsafe"
)

type MyStruct struct {
	a bool   // 1 byte
	b int32  // 4 bytes
	c int64  // 8 bytes
}

func main() {
	var s MyStruct
	fmt.Printf("Size of MyStruct: %d bytes\n", unsafe.Sizeof(s))
	fmt.Printf("Offset of a: %d\n", unsafe.Offsetof(s.a))
	fmt.Printf("Offset of b: %d\n", unsafe.Offsetof(s.b))
	fmt.Printf("Offset of c: %d\n", unsafe.Offsetof(s.c))
}
```

运行上述代码，会得到以下输出（具体数值可能会因编译器和平台而异）：

```
Size of MyStruct: 16 bytes
Offset of a: 0
Offset of b: 4
Offset of c: 8
```
::::

**内存布局解释**

1. `a` 是一个 `bool` 类型，占用 1 个字节，位于偏移量 0。
2. 为了对齐 `b`（`int32`），需要在 `a` 后面插入 3 个填充字节，因此 `b` 的偏移量是 4。
3. `c` 是 `int64` 类型，需要对齐到 8 字节的边界，`b` 的大小正好是 4 字节且在 `a` 之后填充了 3 个字节，使得 `b` 的末尾与 `c` 的起始位置对齐在 8 字节边界，因此 `c` 的偏移量是 8。

总的来说，`MyStruct` 的总大小是 16 个字节，包含了字段和填充字节。

**内存优化**

为了减少结构体的内存占用，可以重新排列字段的顺序，尽量减少填充字节。例如：

```go
type OptimizedStruct struct {
	c int64  // 8 bytes
	b int32  // 4 bytes
	a bool   // 1 byte
}
```

重新排列后的结构体可能占用更少的内存，因为字段 `c` 和 `b` 已经按对齐要求排列，只有在 `b` 和 `a` 之间需要 3 个填充字节。这样优化后的结构体的总大小可能会减小（依旧取决于具体平台和编译器）。

**内存布局优化**

```go
package main

import (
	"fmt"
	"unsafe"
)

type OptimizedStruct struct {
	c int64  // 8 bytes
	b int32  // 4 bytes
	a bool   // 1 byte
}

func main() {
	var s OptimizedStruct
	fmt.Printf("Size of OptimizedStruct: %d bytes\n", unsafe.Sizeof(s))
	fmt.Printf("Offset of c: %d\n", unsafe.Offsetof(s.c))
	fmt.Printf("Offset of b: %d\n", unsafe.Offsetof(s.b))
	fmt.Printf("Offset of a: %d\n", unsafe.Offsetof(s.a))
}
```

运行上述优化后的代码，输出可能是：

```
Size of OptimizedStruct: 16 bytes
Offset of c: 0
Offset of b: 8
Offset of a: 12
```

这表明通过优化字段顺序，结构体的大小可能会更小，同时保证内存对齐。

::: important 总结
了解结构体在内存中的存储方式和对齐规则，有助于编写更高效的代码，尤其是在处理大量结构体或需要高性能内存访问的场景中。合理地排列结构体字段可以减少内存占用和提高访问效率。
:::