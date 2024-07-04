---
order : 2
---

# 2. 环境配置

::: tip 正式学习 Golang 之前首先需要安装配置好 Golang 环境，如果您已经配好环境，跳过即可。
:::

## Golang环境


1. 下载地址：https://golang.google.cn/dl/

![](./assets/environment-config/2024-06-29-14-52-12.png)

2. 选择适合自己的版本进行下载即可

https://golang.google.cn/doc/install

![](./assets/environment-config/2024-06-29-14-49-50.png)

3. 配置变量

:::: tabs
@tab Windows

1. 下载并打开安装文件

![](./assets/environment-config/2024-07-01-09-22-03.png)

![](./assets/environment-config/2024-07-01-09-23-07.png)

2. 保存好安装路径，点击下一步进行安装即可

![](./assets/environment-config/2024-07-01-09-23-58.png)

3. 配置系统环境变量

直接搜索环境变量即可，打开编辑系统环境变量。

![](./assets/environment-config/2024-07-01-09-25-48.png)

![](./assets/environment-config/2024-07-01-09-25-23.png)


选中系统变量中的 Path，点击编辑

![](./assets/environment-config/2024-07-01-09-26-59.png)

这里安装包自动为我们配置好了环境变量，如果没有自动配置，手动点击右边的新建，输入我们第二步保存的 Go 安装路径即可。

![](./assets/environment-config/2024-07-01-09-27-43.png)

3. 检查是否成功

```shell
go version
```

![](./assets/environment-config/2024-07-01-09-29-33.png)


@tab Mac

::: tip 可使用 Homebrew 进行安装，执行 `brew install golang` 命令，即可完成一键安装。
:::


1. 根据对应的芯片架构，选择对应的版本。

![](./assets/environment-config/2024-07-01-09-12-53.png)

2. 打开下载的 pkg 安装包

![](./assets/environment-config/2024-07-01-09-13-46.png)

根据提示引导安装即可。


3. 配置环境变量

```shell
# 注意 = 号前后不能有空格
export GOPATH=/usr/local/go # Go 安装目录
export GOBIN=$GOPATH/bin    # Go 运行目录
export PATH=$PATH:$GOBIN    # 环境变量
```

> 使用安装包进行安装时，默认会配置好环境变量，可先进行第四步检查，不成功再进行配置。

4. 检查是否成功

```go:no-line-numbers
go version
```

![](./assets/environment-config/2024-06-29-15-06-25.png)



@tab Linux

::: info Linux 发行版种类较多，但基本的安装步骤类似，这里仅以 Ubuntu 24.04 LTS 为例演示，其他版本选择对应系统的包管理器即可。
:::

1. 执行安装语句，安装 Golang


```sh
sudo apt install golang
```

![](./assets/environment-config/2024-07-01-09-37-02.png)




2. 检查是否安装成功


![](./assets/environment-config/2024-07-01-09-37-48.png)

::: tip 默认会自动配置环境变量，如果这里不成功，则手动配置，参考第三步即可。
:::


3. 配置环境变量

打开配置文件

```shell
vim ~/.bashrc
```

在文件内容末尾填入如下信息，
```shell
# 注意 = 号前后不能有空格
export GOPATH=/usr/lib/go-1.22 # Go 安装目录，版本号改为自己对应的版本号，或者在 /usr/lib/ 目录下查看对应文件夹
export GOBIN=$GOPATH/bin    # Go 运行目录
export PATH=$PATH:$GOBIN    # 环境变量
```
::::

::: danger  如果完全按照如上步骤进行操作，仍无法通过 go 环境检查，请重启电脑使得环境变量生效即可。
:::

## 开发工具

工欲善其事，必先利其器。一个好的开发工具能让你事半功倍，大大提高开发效率，这里我推荐 VsCode 和 Goland 这两个开发工具。

### VSCode

1. 下载安装：https://code.visualstudio.com/

![](./assets/environment-config/2024-06-29-14-34-01.png)

2. 下载好后安装即可。

3. 配置 Golang 插件

![](./assets/environment-config/2024-06-29-14-35-54.png)

::: important 使用 VSCode 可以直接使用我们配置好的环境变量。
:::

### Goland

1. 下载安装：https://www.jetbrains.com/go/

![](./assets/environment-config/2024-06-29-14-37-30.png)

2. 下载后安装即可。

3. 配置 Golang

![](./assets/environment-config/2024-06-29-14-39-06.png)

配置 GOROOT、GOPATH、GOModuls 为你自己下载安装的对应目录即可。

::: tip 这里配置时，可以使用 Goland 自带的 Go 下载，也可以配置我们自己下载的 Golang。
:::

**优缺点对比：**

1. VSCode 轻量级，还可开发其他任意语言。Goland 仅对 Golang 有较好支持。
2. VSCode 免费开源，有强大的生态支持，Goland Unlimited 版本收费，且价格较高。
3. Goland 可视化界面优秀，对于调试开发更为优雅舒适，VSCode 需要配置插件，较为麻烦。
4. Goland 内置了许多功能，且有 AI 功能，无需其他配置，开箱即用，非常方便。VSCode 功能全靠插件，需要自己配置安装。

::: info 总结：VSCode 和 Goland 各有优缺，选择合适自己的开发工具即可，两者也可同时兼备，无需精神内耗。
:::
