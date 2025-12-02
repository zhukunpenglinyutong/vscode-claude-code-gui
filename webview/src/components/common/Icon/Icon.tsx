import React, { memo } from 'react';

export type IconType = 'codicon' | 'mdi';

interface IconProps {
  /** 图标名称 */
  name: string;
  /** 图标类型：codicon（VS Code 图标）或 mdi（Material Design Icons） */
  type?: IconType;
  /** 图标大小（像素） */
  size?: number | string;
  /** 图标颜色 */
  color?: string;
  /** 额外的 CSS 类名 */
  className?: string;
  /** 点击事件 */
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 标题（悬停提示） */
  title?: string;
  /** 是否旋转（用于加载动画） */
  spin?: boolean;
}

/**
 * 图标组件
 * 支持 VS Code Codicons 和 Material Design Icons
 */
export const Icon = memo(function Icon({
  name,
  type = 'codicon',
  size,
  color,
  className = '',
  onClick,
  style,
  title,
  spin = false
}: IconProps) {
  // 构建图标类名
  const iconClass = type === 'codicon'
    ? `codicon codicon-${name}`
    : `mdi mdi-${name}`;

  // 构建完整的类名
  const fullClassName = [
    iconClass,
    spin ? 'icon-spin' : '',
    className
  ].filter(Boolean).join(' ');

  // 构建样式
  const iconStyle: React.CSSProperties = {
    ...(size !== undefined && {
      fontSize: typeof size === 'number' ? `${size}px` : size
    }),
    ...(color && { color }),
    ...(onClick && { cursor: 'pointer' }),
    ...style
  };

  return (
    <span
      className={fullClassName}
      style={Object.keys(iconStyle).length > 0 ? iconStyle : undefined}
      onClick={onClick}
      title={title}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      } : undefined}
    />
  );
});

/**
 * Codicon 图标快捷组件
 */
export const Codicon = memo(function Codicon(
  props: Omit<IconProps, 'type'>
) {
  return <Icon {...props} type="codicon" />;
});

/**
 * MDI 图标快捷组件
 */
export const MdiIcon = memo(function MdiIcon(
  props: Omit<IconProps, 'type'>
) {
  return <Icon {...props} type="mdi" />;
});

export default Icon;
