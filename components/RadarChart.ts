const { ccclass, property, executeInEditMode, executionOrder } = cc._decorator;

@ccclass
@executeInEditMode
@executionOrder(-10)
export default class RadarChart extends cc.Component {

    @property({ type: cc.Node, tooltip: CC_DEV && '绘制目标节点' })
    private target: cc.Node = null;

    @property private _axisLength: number = 200;
    @property({ tooltip: CC_DEV && '轴长' })
    public get axisLength() { return this._axisLength; }
    public set axisLength(value: number) { this._axisLength = value; this.draw(this.curDatas); }

    @property private _axes: number = 6;
    @property({ tooltip: CC_DEV && '轴数（至少 3 条）' })
    public get axes() { return this._axes; }
    public set axes(value: number) { this._axes = Math.floor(value >= 3 ? value : 3); this.draw(this.curDatas); }

    @property private _drawAxes: boolean = true;
    @property({ tooltip: CC_DEV && '是否绘制轴' })
    public get drawAxes() { return this._drawAxes; }
    public set drawAxes(value: boolean) { this._drawAxes = value; this.draw(this.curDatas); }

    @property private _drawDataJoin: boolean = true;
    @property({ tooltip: CC_DEV && '是否绘制数据节点' })
    public get drawDataJoin() { return this._drawDataJoin; }
    public set drawDataJoin(value: boolean) { this._drawDataJoin = value; this.draw(this.curDatas); }

    @property private _nodesPerAxle: number = 3;
    @property({ tooltip: CC_DEV && '轴上节点数（至少 1 个，不包括圆心）' })
    public get nodesPerAxle() { return this._nodesPerAxle; }
    public set nodesPerAxle(value: number) { this._nodesPerAxle = Math.floor(value >= 1 ? value : 1); this.draw(this.curDatas); }

    @property private _baseLineWidth: number = 4;
    @property({ tooltip: CC_DEV && '轴和外线的宽度' })
    public get baseLineWidth() { return this._baseLineWidth; }
    public set baseLineWidth(value: number) { this._baseLineWidth = value; this.draw(this.curDatas); }

    @property private _baseInnerLineWidth: number = 4;
    @property({ tooltip: CC_DEV && '内线宽度' })
    public get baseInnerLineWidth() { return this._baseInnerLineWidth; }
    public set baseInnerLineWidth(value: number) { this._baseInnerLineWidth = value; this.draw(this.curDatas); }

    @property private _baseLineColor: cc.Color = cc.Color.GRAY;
    @property({ tooltip: CC_DEV && '基本线颜色' })
    public get baseLineColor() { return this._baseLineColor; }
    public set baseLineColor(value: cc.Color) { this._baseLineColor = value; this.draw(this.curDatas); }

    @property private _baseFillColor: cc.Color = cc.color(100, 100, 100, 100);
    @property({ tooltip: CC_DEV && '基本填充颜色' })
    public get baseFillColor() { return this._baseFillColor; }
    public set baseFillColor(value: cc.Color) { this._baseFillColor = value; this.draw(this.curDatas); }

    @property private _dataValuesStrings: string[] = ['0.8,0.5,0.6,0.5,0.8,0.6', '0.5,0.9,0.5,0.8,0.5,0.9'];
    @property({ type: [cc.String], tooltip: CC_DEV && '数据数值（字符串形式，使用英文逗号分隔）' })
    public get dataValuesStrings() { return this._dataValuesStrings; }
    public set dataValuesStrings(value: string[]) { this._dataValuesStrings = value; this.drawWithProperties(); }

    @property private _dataLineWidths: number[] = [5, 5];
    @property({ type: [cc.Integer], tooltip: CC_DEV && '数据线宽度' })
    public get dataLineWidths() { return this._dataLineWidths; }
    public set dataLineWidths(value: number[]) { this._dataLineWidths = value; this.drawWithProperties(); }

    @property private _dataLineColors: cc.Color[] = [cc.Color.BLUE, cc.Color.RED];
    @property({ type: [cc.Color], tooltip: CC_DEV && '数据线颜色' })
    public get dataLineColors() { return this._dataLineColors; }
    public set dataLineColors(value: cc.Color[]) { this._dataLineColors = value; this.drawWithProperties(); }

    @property private _dataFillColors: cc.Color[] = [cc.color(120, 120, 180, 100), cc.color(180, 120, 120, 100)];
    @property({ type: [cc.Color], tooltip: CC_DEV && '数据填充颜色' })
    public get dataFillColors() { return this._dataFillColors; }
    public set dataFillColors(value: cc.Color[]) { this._dataFillColors = value; this.drawWithProperties(); }

    @property private _dataJoinColors: cc.Color[] = [];
    @property({ type: [cc.Color], tooltip: CC_DEV && '数据节点颜色' })
    public get dataJoinColors() { return this._dataJoinColors; }
    public set dataJoinColors(value: cc.Color[]) { this._dataJoinColors = value; this.drawWithProperties(); }

    private graphics: cc.Graphics = null;

    private keepUpdating: boolean = false;

    private angles: number[] = null;

    private _curDatas: RadarChartData[] = [];
    public get curDatas() { return this._curDatas; }

    private toRes: () => void = null;

    protected onLoad() {
        this.init();
        this.drawWithProperties();
    }

    protected update() {
        if (!this.keepUpdating || this._curDatas.length === 0) return;
        this.draw(this._curDatas);
    }

    /**
     * 初始化
     */
    private init() {
        // 获取组件
        if (!this.target) this.target = this.node;
        this.graphics = this.target.getComponent(cc.Graphics) || this.target.addComponent(cc.Graphics);
        // 设置端点和拐角样式
        this.graphics.lineJoin = cc.Graphics.LineJoin.ROUND;
        this.graphics.lineCap = cc.Graphics.LineCap.ROUND;
    }

    /**
     * 使用当前属性绘制
     */
    private drawWithProperties() {
        // 获取属性面板配置
        let datas: RadarChartData[] = [];
        for (let i = 0; i < this.dataValuesStrings.length; i++) {
            datas.push({
                values: this.processValuesString(this.dataValuesStrings[i]),
                lineWidth: this._dataLineWidths[i] || defaultConfig.lineWidth,
                lineColor: this._dataLineColors[i] || defaultConfig.lineColor,
                fillColor: this._dataFillColors[i] || defaultConfig.fillColor,
                joinColor: this._dataJoinColors[i] || defaultConfig.joinColor
            });
        }
        // 绘制
        this.draw(datas);
    }

    /**
     * 将数值字符串转为数值数组
     * @param valuesString 数值字符串
     */
    private processValuesString(valuesString: string): number[] {
        const strings = valuesString.split(',');
        let values: number[] = [];
        for (let j = 0; j < strings.length; j++) {
            const value = parseFloat(strings[j]);
            values.push(isNaN(value) ? 0 : value);
        }
        return values;
    }

    /**
     * 画基本线框
     */
    private drawBase() {
        // 填充染料
        this.graphics.lineWidth = this._baseLineWidth;
        this.graphics.strokeColor = this._baseLineColor;
        this.graphics.fillColor = this._baseFillColor;

        // 计算夹角
        this.angles = [];
        const iAngle = 360 / this.axes;
        for (let i = 0; i < this.axes; i++) this.angles.push(iAngle * i);

        // 计算节点坐标
        let pointSet = [];
        for (let i = 0; i < this._nodesPerAxle; i++) {
            let points = [];
            const length = this._axisLength - (this._axisLength / this._nodesPerAxle * i);
            for (let j = 0; j < this.angles.length; j++) {
                const radian = (Math.PI / 180) * this.angles[j];
                points.push(cc.v2(length * Math.cos(radian), length * Math.sin(radian)));
            }
            pointSet.push(points);
        }

        // 画轴
        if (this._drawAxes) {
            for (let i = 0; i < pointSet[0].length; i++) {
                this.graphics.moveTo(0, 0);
                this.graphics.lineTo(pointSet[0][i].x, pointSet[0][i].y);
            }
        }

        // 画外线
        this.graphics.moveTo(pointSet[0][0].x, pointSet[0][0].y);
        for (let i = 1; i < pointSet[0].length; i++) {
            this.graphics.lineTo(pointSet[0][i].x, pointSet[0][i].y);
        }
        this.graphics.close(); // 闭合
        this.graphics.fill(); // 填充颜色
        this.graphics.stroke(); // 绘制

        // 画内线
        if (pointSet.length > 1) {
            this.graphics.lineWidth = this._baseInnerLineWidth;
            for (let i = 1; i < pointSet.length; i++) {
                this.graphics.moveTo(pointSet[i][0].x, pointSet[i][0].y);
                for (let j = 1; j < pointSet[i].length; j++) {
                    this.graphics.lineTo(pointSet[i][j].x, pointSet[i][j].y);
                }
                this.graphics.close(); // 闭合
            }
            this.graphics.stroke(); // 绘制
        }
    }

    /**
     * 绘制数据
     * @param data 数据
     */
    public draw(data: RadarChartData | RadarChartData[]) {
        // 清除旧图像
        this.graphics.clear();

        // 画基础表
        this.drawBase();

        // 处理数据
        const datas = Array.isArray(data) ? data : [data];
        this._curDatas = datas;

        // 数值不足需补 0
        this.resizeCurDatasValues(0);

        // 开始绘制数据
        for (let i = 0; i < datas.length; i++) {
            // 填充染料
            this.graphics.strokeColor = datas[i].lineColor || defaultConfig.lineColor;
            this.graphics.fillColor = datas[i].fillColor || defaultConfig.fillColor;
            this.graphics.lineWidth = datas[i].lineWidth || defaultConfig.lineWidth;

            // 计算节点坐标
            let points = [];
            for (let j = 0; j < this.axes; j++) {
                const value = datas[i].values[j] > 1 ? 1 : datas[i].values[j];
                const length = value * this.axisLength;
                const radian = (Math.PI / 180) * this.angles[j];
                points.push(cc.v2(length * Math.cos(radian), length * Math.sin(radian)));
            }

            // 画线
            this.graphics.moveTo(points[0].x, points[0].y);
            for (let j = 1; j < points.length; j++) {
                this.graphics.lineTo(points[j].x, points[j].y);
            }
            this.graphics.close(); // 闭合
            this.graphics.fill(); // 填充颜色
            this.graphics.stroke(); // 绘制线段

            // 绘制节点
            if (this._drawDataJoin) {
                for (let j = 0; j < points.length; j++) {
                    // 大圆
                    this.graphics.strokeColor = datas[i].lineColor || defaultConfig.lineColor;
                    this.graphics.circle(points[j].x, points[j].y, 2);
                    this.graphics.stroke();
                    // 小圆
                    this.graphics.strokeColor = datas[i].joinColor || defaultConfig.joinColor;
                    this.graphics.circle(points[j].x, points[j].y, .65);
                    this.graphics.stroke();
                }
            }
        }
    }

    /**
     * 动态绘制
     * @param data 目标数据
     * @param duration 动作时长
     */
    public to(data: RadarChartData | RadarChartData[], duration: number): Promise<void> {
        return new Promise(res => {
            // 处理上一个 Promise
            this.unscheduleAllCallbacks();
            this.toRes && this.toRes();
            this.toRes = res;

            // 处理单条数据
            const datas = Array.isArray(data) ? data : [data];

            // 开启每帧更新
            this.keepUpdating = true;

            // 动起来！
            for (let i = 0; i < datas.length; i++) {
                if (!this._curDatas[i]) continue;
                // 数据动！
                for (let j = 0; j < this._curDatas[i].values.length; j++) {
                    const value = datas[i].values[j] > 1 ? 1 : datas[i].values[j];
                    cc.tween(this._curDatas[i].values)
                        .to(duration, { [j]: value })
                        .start();
                }
                // 样式动！
                cc.tween(this._curDatas[i])
                    .to(duration, {
                        lineWidth: datas[i].lineWidth || this._curDatas[i].lineWidth,
                        lineColor: datas[i].lineColor || this._curDatas[i].lineColor,
                        fillColor: datas[i].fillColor || this._curDatas[i].fillColor,
                        joinColor: datas[i].joinColor || this._curDatas[i].joinColor
                    })
                    .start();
            }

            this.scheduleOnce(() => {
                this.keepUpdating = false;
                this.toRes();
                this.toRes = null;
            }, duration);
        });
    }

    /**
     * 检查并调整数据中的数值数量
     * @param fill 填充数值
     */
    private resizeCurDatasValues(fill: number = 0) {
        for (let i = 0; i < this._curDatas.length; i++) {
            // 数值数量少于轴数时才进行调整
            if (this._curDatas[i].values.length < this._axes) {
                const diff = this._axes - this._curDatas[i].values.length;
                for (let j = 0; j < diff; j++) this._curDatas[i].values.push(fill);
            }
        }
    }

}

/**
 * 雷达图数据
 */
export interface RadarChartData {

    /** 数值 */
    values: number[];

    /** 线宽 */
    lineWidth?: number;

    /** 线颜色 */
    lineColor?: cc.Color;

    /** 填充颜色 */
    fillColor?: cc.Color;

    /** 节点颜色 */
    joinColor?: cc.Color;

}

/**
 * 不指定时使用的样式配置
 */
const defaultConfig = {
    lineWidth: 5,
    lineColor: cc.Color.BLUE,
    fillColor: cc.color(120, 120, 180, 100),
    joinColor: cc.Color.WHITE,
}
