import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";

type Props = {
  option: EChartsOption;
  loading?: boolean;
  height?: number | string;
  className?: string;
};

/**
 * Unified ECharts wrapper — all report charts MUST use this component.
 */
export default function BaseChart({
  option,
  loading = false,
  height = 320,
  className = "",
}: Props) {
  const style = useMemo(
    () => ({
      height: typeof height === "number" ? `${height}px` : height,
      width: "100%",
    }),
    [height],
  );

  return (
    <div className={`relative w-full ${className}`}>
      <ReactECharts
        option={option}
        showLoading={loading}
        style={style}
        notMerge
        lazyUpdate
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
