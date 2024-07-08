---
order : 6
---

# 6. 模板渲染

模板渲染是将动态数据嵌入到 HTML 模板中，使得服务器可以动态生成并返回 HTML 内容给客户端。在 Gin 框架中，可以通过加载 HTML 模板文件并将数据传递给模板来实现渲染。

其实在响应这一章节就已经展示了模板渲染的案例，这里对其进行详细说明。

## 1. 加载模板文件

首先，需要加载存放 HTML 模板文件的目录。

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 加载 HTML 模板文件，templates 目录下的所有 .html 文件
	r.LoadHTMLGlob("templates/*")

	// 或者加载单个 HTML 模板文件
	// r.LoadHTMLFiles("templates/index.html")

	r.Run(":8080")
}
```

## 2. 定义路由和处理函数

定义一个路由，当用户访问该路由时，向客户端返回渲染后的 HTML 内容。

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	r := gin.Default()

	// 加载 HTML 模板文件
	r.LoadHTMLGlob("templates/*")

	// 定义路由，渲染 index.html 模板
	r.GET("/index", func(c *gin.Context) {
		// 渲染 HTML 模板，并传递数据
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "Home Page",
		})
	})

	r.Run(":8080")
}
```

## 3. 编写 HTML 模板文件

在 `templates` 目录下创建一个 `index.html` 文件，编写模板内容。

```html
<!DOCTYPE html>
<html>
<head>
    <title>{{ .title }}</title>
</head>
<body>
    <h1>Welcome to {{ .title }}</h1>
</body>
</html>
```

## 4. 渲染模板并传递数据

在处理函数中使用 `c.HTML` 方法渲染模板，并传递一个 `gin.H` 对象作为模板的数据上下文。在模板文件中，使用 `{{ .变量名 }}` 的方式来访问传递的数据。

## 注意事项

- **模板路径问题：** 确保 `LoadHTMLGlob` 或 `LoadHTMLFiles` 方法正确加载了模板文件的路径。
- **数据传递：** 使用 `gin.H` 传递数据时，模板中可以直接访问 `gin.H` 中定义的字段。
- **模板语法：** Gin 使用 Go 的 `html/template` 包作为模板引擎，默认支持 Go 模板的语法和特性。

通过使用模板渲染，可以在 Gin 应用中动态生成 HTML 内容，将后端处理的数据有效地展示给用户。这对于构建动态网页和 web 应用是非常有帮助的。