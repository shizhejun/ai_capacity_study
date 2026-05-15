# DXF用地边界线提取与WebGIS可视化

## 目标
从DXF文件中提取用地边界，创建可视化查询系统。

## 成果文件

| 文件 | 说明 |
|------|------|
| `original_files/test.dxf` | 原始DXF文件 |
| `test_boundaries_only.dxf` | 提取后的边界DXF（含TEXT标签） |
| `land_use.geojson` | GeoJSON格式数据 |
| `用地索引表.csv` | 用地指标索引表 |
| `index.html` | WebGIS可视化页面 |

## 一、DXF边界提取

### 核心技术：ezdxf.path.from_hatch

```python
from ezdxf.path import from_hatch
from shapely.geometry import Polygon

for hatch in msp.query('HATCH'):
    paths = list(from_hatch(hatch))
    all_pts = []
    for p in paths:
        for pt in p.flattening(0.5):  # 弧线离散化
            all_pts.append((pt.x, pt.y))
    poly = Polygon(all_pts)
```

### 关键点
1. **from_hatch** - AutoCAD内部方法，正确处理边的方向
2. **flattening(0.5)** - 弧线离散化精度
3. **buffer(0)** - 修复浮点精度导致的无效多边形

## 二、TEXT标签定位

### 问题
凹多边形的质心(Centroid)可能落在多边形外部

### 解决方案：拓扑中心算法

```python
def get_topological_center(poly):
    """获取多边形内部的一个点"""
    minx, miny, maxx, maxy = poly.bounds
    center_x = (minx + maxx) / 2
    center_y = (miny + maxy) / 2
    center_pt = Point(center_x, center_y)

    # 如果中心在多边形内，直接返回
    if poly.contains(center_pt):
        return center_pt

    # 网格搜索找内部点
    for i in range(1, 20):
        for j in range(1, 20):
            px = minx + (maxx - minx) * i / 20
            py = miny + (maxy - miny) * j / 20
            pt = Point(px, py)
            if poly.contains(pt):
                return pt

    return poly.centroid
```

## 三、编码规则

格式：`{用地类型}-{序号}`

示例：YD-A33-1, YD-A33-2, YD-G1-1, YD-G1-2

## 四、统计结果

| 图层 | 地块数 | 面积(公顷) | 颜色 |
|------|--------|------------|------|
| YD-A_边线 | 1 | 0.32 | 211 |
| YD-A33_边线 | 4 | 14.24 | 211 |
| YD-A4_边线 | 6 | 9.42 | 111 |
| YD-B1B2_边线 | 10 | 18.03 | 1 |
| YD-B41_边线 | 1 | 0.65 | 13 |
| YD-E1_边线 | 11 | 8.06 | 4 |
| YD-E2_边线 | 6 | 9.58 | 111 |
| YD-G1_边线 | 27 | 35.39 | 3 |
| YD-G2_边线 | 22 | 6.76 | 94 |
| YD-R2_边线 | 12 | 23.37 | 2 |
| YD-R2B1_边线 | 5 | 7.79 | 30 |
| YD-S41_边线 | 2 | 1.21 | 254 |
| YD-U12_边线 | 2 | 0.67 | 152 |
| **合计** | **109** | **135.49** | - |

## 五、WebGIS可视化

### 技术栈
- Canvas 2D 渲染（轻量无依赖）
- 原生JavaScript
- GeoJSON 数据格式

### 功能
- 地块列表 + 搜索过滤
- 点击/悬停高亮
- 信息面板显示指标
- 缩放控制

### 启动方式
```bash
cd /media/z/PROJECTS/ai_capacity
python3 -m http.server 8080
```
浏览器打开 http://localhost:8080

## 六、常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 边方向不一致 | HATCH边顺序问题 | 用from_hatch |
| 圆弧处理不当 | ArcEdge未离散化 | 用flattening() |
| 自相交无效 | 浮点精度问题 | buffer(0)修复 |
| TEXT不在范围内 | 质心在凹多边形外 | 网格搜索内部点 |

## 七、后续扩展

1. 添加更多指标（容积率、建筑密度等）
2. 支持导出不同坐标系
3. 添加测量工具（距离、面积）
4. 图层控制（显示/隐藏）
5. 打印输出功能

## 八、开发强度潜力分析 (新增)

### 分析方法

基于城市规划标准，计算每个地块的开发强度潜力：

#### 1. 基本容积率 (FAR)
根据用地类型确定基准容积率：
- 商住混合用地(B1B2, R2, R2B1): 2.5-3.5
- 住宅用地(A33, A4): 1.5-2.0
- 绿地(G1, G2): 0.2-0.5
- 交通用地(E1, E2): 0.4-0.8

#### 2. 形态修正系数
- 紧凑度：4πA/P² (1为圆形)
- 矩形度：地块面积/最小包围盒面积
- 形态系数 = 紧凑度 × 矩形度

#### 3. 面积修正系数
- <0.5公顷：0.6 (规模偏小)
- 0.5-2公顷：0.85
- 2-10公顷：1.0 (最佳规模)
- >10公顷：0.95 (规模过大)

#### 4. 最终调整容积率
调整FAR = 基本FAR × 形态系数 × 面积系数

### 分析结果

| 用地类型 | 地块数 | 平均FAR | 平均潜力分 |
|----------|--------|---------|-----------|
| YD-B1B2 | 10 | 1.58 | 65.7 |
| YD-B41 | 1 | 1.60 | 65.8 |
| YD-R2B1 | 5 | 1.38 | 60.5 |
| YD-R2 | 12 | 1.21 | 56.1 |

### TOP 5 高潜力地块
1. YD-B1B2-9: FAR 2.72, 评分 100
2. YD-B1B2-4: FAR 2.29, 评分 91.9
3. YD-R2-4: FAR 1.56, 评分 69.2
4. YD-R2-7: FAR 1.54, 评分 68.5
5. YD-B1B2-8: FAR 1.62, 评分 67.9

### 启动
```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/index_potential.html
```
