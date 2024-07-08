---
order : 3
---

# 3. 请求参数

## Get 参数

Get 请求的参数会显式的展示在 URL 中，通过 ？来和资源路径区分。

例如 `http://localhost:8080/search?page=1&keyword=golang` 的 Get 请求传递了两个参数 page 和 keyword。

Get 请求的参数不具有任何安全性，明文传输，且能传输的信息量较少，故一般用来传递一些非敏感信息。

### 1. 普通参数

- 请求 URL ：`http://localhost:8080/search?page=1&keyword=golang`

- 参数获取：

```go
r.GET("/search", func(ctx *gin.Context) {
    page := ctx.Query("page")
    keyword := ctx.Query("keyword")
    ctx.JSON(200, gin.H{
        "page":   page,
        "keyword": keyword,
    })
})
```

::: tip 除直接获取以外，Gin 还提供了一些常见的 API
- Query : 直接获取，不存在则返回 "" 空字符串。
- DefaultQuery : 默认值回去，不存在则返回指定的默认值。
- GetQuery : 获取并判断参数是否存在，两个返回值，如果不存在则返回 "" 和 err。
:::

:::: details API 源码
```go
// Query returns the keyed url query value if it exists,
// otherwise it returns an empty string `("")`.
// It is shortcut for `c.Request.URL.Query().Get(key)`
//
//	    GET /path?id=1234&name=Manu&value=
//		   c.Query("id") == "1234"
//		   c.Query("name") == "Manu"
//		   c.Query("value") == ""
//		   c.Query("wtf") == ""
func (c *Context) Query(key string) (value string) {
	value, _ = c.GetQuery(key)
	return
}

// DefaultQuery returns the keyed url query value if it exists,
// otherwise it returns the specified defaultValue string.
// See: Query() and GetQuery() for further information.
//
//	GET /?name=Manu&lastname=
//	c.DefaultQuery("name", "unknown") == "Manu"
//	c.DefaultQuery("id", "none") == "none"
//	c.DefaultQuery("lastname", "none") == ""
func (c *Context) DefaultQuery(key, defaultValue string) string {
	if value, ok := c.GetQuery(key); ok {
		return value
	}
	return defaultValue
}

// GetQuery is like Query(), it returns the keyed url query value
// if it exists `(value, true)` (even when the value is an empty string),
// otherwise it returns `("", false)`.
// It is shortcut for `c.Request.URL.Query().Get(key)`
//
//	GET /?name=Manu&lastname=
//	("Manu", true) == c.GetQuery("name")
//	("", false) == c.GetQuery("id")
//	("", true) == c.GetQuery("lastname")
func (c *Context) GetQuery(key string) (string, bool) {
	if values, ok := c.GetQueryArray(key); ok {
		return values[0], ok
	}
	return "", false
}
```
::::

### 2. 数组参数

- 请求 URL ：http://localhost:8080/items?id=1&id=2&id=3

- 参数获取：

```go
r.GET("/items", func(c *gin.Context) {
    // 使用 QueryArray 方法获取数组参数
    ids := c.QueryArray("id")

    // 返回解析后的数组数据
    c.JSON(http.StatusOK, gin.H{
        "ids": ids,
    })
})

r.GET("/items", func(c *gin.Context) {
    // 使用 QueryArray 方法获取数组参数
    ids,ok := c.GetQueryArray("id")

    // 检查参数是否存在
    if !ok {
        // 返回解析后的数组数据
        c.JSON(http.StatusOK, gin.H{
            "msg": "参数不存在！",
        })
        return
    }

    // 返回解析后的数组数据
    c.JSON(http.StatusOK, gin.H{
        "ids": ids,
    })
})
```

::: tip 获取数组，Gin 提供了两个直接 API，同时也可以使用后续结构体中的 Bind 方法。
- QueryArray : 直接获取，不存在则返回空字符串数组，实际上底层调用的是 GetQueryArray
- GetQueryArray : 获取并判断参数是否存在，两个返回值，如果不存在则返回空字符串数组 和 ok。
:::

:::: details API 源码
```go
// QueryArray returns a slice of strings for a given query key.
// The length of the slice depends on the number of params with the given key.
func (c *Context) QueryArray(key string) (values []string) {
	values, _ = c.GetQueryArray(key)
	return
}

// GetQueryArray returns a slice of strings for a given query key, plus
// a boolean value whether at least one value exists for the given key.
func (c *Context) GetQueryArray(key string) (values []string, ok bool) {
	c.initQueryCache()
	values, ok = c.queryCache[key]
	return
}
```
::::
### 3. Map 参数

- 请求 URL ：http://localhost:8080/user/save?userMap[username]=GolangNotes&userMap[age]=18
- 获取参数：

```go
r.GET("/user", func(ctx *gin.Context) {
    // 使用 QueryMap 方法将嵌套查询参数解析为 map
    userMap := ctx.QueryMap("userMap")
    ctx.JSON(http.StatusOK, userMap)
})

r.GET("/user", func(ctx *gin.Context) {
    // 使用 QueryMap 方法将嵌套查询参数解析为 map
    userMap := ctx.GetQueryMap("userMap")
    ctx.JSON(http.StatusOK, userMap)
})
```
::: tip 获取 Map，Gin 提供了两个直接 API，Bind 方法不能直接解析，只能先转换为结构体，再将结构体转换为 Map
- QueryMap : 直接获取指定前缀的所有查询参数并解析为 map，如果参数不存在，返回一个空 map。实际上底层调用的是 GetQueryMap
- GetQueryMap : 获取指定前缀的所有查询参数并解析为 map，同时返回一个布尔值，指示该前缀的查询参数是否存在。
:::

:::: details API 源码
```go
// QueryMap returns a map for a given query key.
func (c *Context) QueryMap(key string) (dicts map[string]string) {
	dicts, _ = c.GetQueryMap(key)
	return
}

// GetQueryMap returns a map for a given query key, plus a boolean value
// whether at least one value exists for the given key.
func (c *Context) GetQueryMap(key string) (map[string]string, bool) {
	c.initQueryCache()
	return c.get(c.queryCache, key)
}
```
::::

### 4. 结构体参数

当需要将客户端请求中携带的参数直接解析为指定的结构体时，需要使用第一中方法手动构建，但是手动构建效率差，故 Gin 提供了封装方法，可以使用 BindQuery 和 ShouldBindQuery。

- 请求 URL ：http://localhost:8080/example?name=John&age=30

- 参数获取：

```go
type QueryParams struct {
    Name string `form:"name" binding:"required"`
    Age  int    `form:"age" binding:"required"`
}

r.GET("/bindquery", func(c *gin.Context) {
    var queryParams QueryParams
    if err := c.BindQuery(&queryParams); err != nil {
        // 在绑定失败时自动返回 HTTP 400 状态码和错误信息
        return
    }
    c.JSON(http.StatusOK, queryParams)
})

r.GET("/shouldbindquery", func(c *gin.Context) {
    var queryParams QueryParams
    if err := c.ShouldBindQuery(&queryParams); err != nil {
        // 手动处理错误
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, queryParams)
})
```

BindQuery 和 ShouldBindQuery 都用于绑定查询参数到结构体。但 BindQuery 方法在绑定失败后会自动返回 HTTP 400 状态码和错误信息，而 ShouldBindQuery 不会自动返回错误的响应，而是仅在程序中返回错误信息，开发者需要手动处理错误。

::: info 这种方式也可以解析数组，定义一个数组的结构体即可
```go
// 定义接收查询参数的结构体
type ItemsRequest struct {
    IDs []string `form:"id"`
}

// 处理 GET 请求
r.GET("/items", func(c *gin.Context) {
    var req ItemsRequest
    if err := c.BindQuery(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 返回解析后的数组数据
    c.JSON(http.StatusOK, gin.H{
        "ids": req.IDs,
    })
})
```
:::

## Post 参数

在 Gin 框架中，处理 POST 请求的参数通常涉及解析请求体中的数据，这些数据可以是 JSON 格式、表单数据等。

### 1. JSON 数据

如果客户端发送的是 JSON 格式的 POST 请求体，可以使用 BindJSON 方法将请求体中的 JSON 数据解析到一个结构体中。

```go
type User struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

// 处理 POST 请求
r.POST("/user", func(c *gin.Context) {
    var user User
    if err := c.BindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 处理接收到的用户数据
    c.JSON(http.StatusOK, user)
})
```

### 2. 表单数据

如果客户端发送的是表单数据，可以使用 Bind 方法将其解析为结构体或使用 PostForm 方法直接获取单个表单字段的值。

```go
type FormData struct {
    Name    string `form:"name"`
    Email   string `form:"email"`
    Message string `form:"message"`
}

// 处理 POST 请求
r.POST("/form", func(c *gin.Context) {
    var formData FormData
    if err := c.Bind(&formData); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 处理接收到的表单数据
    c.JSON(http.StatusOK, formData)
})
```

## 路径参数

在 Gin 框架中，路径参数用于在 URL 路径中传递参数，这些参数可以通过 Param 方法在处理函数中获取。路径参数通常用于 RESTful API 中，便于标识资源或传递动态数据。

实际上这种方式也可以看做是 Get 请求参数的一种，是记录在 URL 资源部分中的参数，但是又和实际的参数有所区别。在路由章节也有提及。

- 请求 URL ：http://localhost:8080/user/123

```go
// 定义带路径参数的路由
r.GET("/user/:id", func(c *gin.Context) {
    // 获取路径参数
    id := c.Param("id")
    c.JSON(http.StatusOK, gin.H{"userID": id})
})
```

## 文件上传

如果需要处理文件上传或其他类型的多部分表单数据，可以使用 FormFile 方法来获取文件，或者结合 MultipartForm 方法处理整个多部分表单请求。

### 单文件

我们使用 c.FormFile("file") 来获取上传的单个文件，并使用 c.SaveUploadedFile(file, destination) 将文件保存到指定目录。

```go
r.POST("/upload", func(c *gin.Context) {
    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(400, gin.H{"error": "No file is received"})
        return
    }
    c.SaveUploadedFile(file, "./uploads/"+file.Filename)
    c.JSON(200, gin.H{
        "message": "File uploaded successfully!",
        "filename": file.Filename,
    })
})
```

### 多文件

对于多文件上传，我们使用c.MultipartForm()来获取所有文件，并遍历保存。

```go
r.POST("/upload/multiple", func(c *gin.Context) {
    form, _ := c.MultipartForm()
    files := form.File["files"]
    for _, file := range files {
        c.SaveUploadedFile(file, "./uploads/"+file.Filename)
    }
    c.JSON(200, gin.H{
        "message": fmt.Sprintf("%d files uploaded!", len(files)),
    })
})
```
