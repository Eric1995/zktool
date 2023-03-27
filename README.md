# zktool 介绍及使用说明

Zookeeper 是一个分布式的、开源的程序协调服务，主要服务于分布式系统，可以用 ZooKeeper 来做：统一配置管理、统一命名服务、分布式锁、集群管理。目前浩鲸公司内部使用的 Dubbo 框架普遍依赖 Zookeeper 实现服务发现及管理。但是 Zookeeper 官方并没有推出可视化工具，网络上普遍流传的 Zokeeper 可视化操作工具普遍长时间不经维护，或者界面丑陋，使用繁琐，运行麻烦，不支持中文等。因此本人决定开发一个小巧的，使用起来方便的 Zookeeper 管理工具，名为 zktool。该工具使用现代化的框架开发，界面美观，操作方便，支持中文，更重要的是，在安装了 Nodejs 的情况下，只需要运行两行命令就可以安装和运行，非常简洁。

> 前提：zktool 依赖 Nodejs，如果平台未安装 Nodejs，可到`https://nodejs.org`下载安装

## 1. 如何安装及运行

1. 运行 `npm install -g zktool`安装 zktool
2. 运行 `zktool -p 8080 -o` 在 8080 端口运行 zktool，并自动在浏览器打开

> ` -p port` 参数指定运行端口，`-o` 参数自动在浏览器打开`http://localhost:8080`页面使用。如果需要停止运行，只需要使用 `Ctrl + C` 组合键。

## 2. 使用说明

### 1. 注册中心管理

点击注册中心按钮，可以进行注册中心的添加，删除，查看连接状态，刷新连接状态等操作。添加的注册中心会存储在命令行运行目录下的`registry.json`文件里。下次在此目录启动zktool时，会自动读取该文件的注册中心列表并加载。
![image.png](https://s2.loli.net/2023/03/27/VhwkCIS83clyX5d.png)
![image.png](https://s2.loli.net/2023/03/27/cKDHUVYbqSW4NP3.png)

### 2. Zookeeper 节点管理

在注册中心按钮左边的选择框里选择一个添加的地址，就可以查看在 Zookeeper 的节点树。
![image.png](https://s2.loli.net/2023/03/27/oTEIQy1eAupYVUd.png)  
绿色图标里的数字表示该节点的子节点数量  
![image.png](https://s2.loli.net/2023/03/27/KfyTjecdXthOpwC.png)  
漏斗状的图标表示可以按照条件过滤该节点的子节点
![image.png](https://s2.loli.net/2023/03/27/ZeoaASMmO46KR97.png)  
点击可以设置过滤条件  
![image.png](https://s2.loli.net/2023/03/27/7zCUAu59pqtS8Kx.png)  
蓝色的图标为重新加载该节点，当该节点或者其后代节点变化时，可以用此按钮刷新  
![image.png](https://s2.loli.net/2023/03/27/lau9eBj4F5RMpoN.png)  
在一个节点上右键单击可以弹出菜单，可以对该节点进行删除，添加子节点，更改数据操作  
![image.png](https://s2.loli.net/2023/03/27/3BguaIY41JdDo9W.png)    
![image.png](https://s2.loli.net/2023/03/27/kGOZ83rFQJeyuiS.png)
![image.png](https://s2.loli.net/2023/03/27/43mkD1UXcohnJqx.png)
![image.png](https://s2.loli.net/2023/03/27/HlW6ZX4eTICkLvg.png)

### 3. Zookeeper 节点详情
单击一个节点，可以在右侧面版查看该节点的详细数据

#### 1）. 节点名称  
该标签页展示节点的完整名称，并且可以对节点名称进行进一步处理展示。  
![image.png](https://s2.loli.net/2023/03/27/1ZiVf9Nny58gwYp.png)    
点击第一个按钮，可以对URL类型的数据进行转义，使其更可读。例如Dubbo的提供者信息为一条URL，可以对其进行转义，获取可读信息。
![image.png](https://s2.loli.net/2023/03/27/zcZfYhjLwRAdVPS.png)    
点击第二个按钮，可以格式化URL数据，以表格形式展示URL中的参数信息，例如解析Dubbo的提供者参数
![image.png](https://s2.loli.net/2023/03/27/HTp42gBb3IjdM5h.png)
点击第三个按钮，可以复制该节点名称
![image.png](https://s2.loli.net/2023/03/27/4ovyHRjzLVgQZnB.png)

#### 2）. 统计数据
此标签页可以展示节点的STAT信息，方便错误定位等。
![image.png](https://s2.loli.net/2023/03/27/6ps79vgQYxkzhi2.png)

#### 3）. 节点数据
此标签可以查看节点的数据，并支持以UTF-8和不同进制查看数据，复制节点信息
![image.png](https://s2.loli.net/2023/03/27/JtgZS7UsGiORaE9.png)    
![image.png](https://s2.loli.net/2023/03/27/eWgFNtLIuPZdfhO.png)