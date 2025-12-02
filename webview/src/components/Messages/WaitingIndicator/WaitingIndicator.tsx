import React, { useState, useEffect, useRef, memo } from 'react';
import styles from './WaitingIndicator.module.css';

interface WaitingIndicatorProps {
  size?: number;
  permissionMode?: string;
}

// Icon animation sequence
const icons = ['\xB7', '\u2722', '*', '\u2736', '\u273B', '\u273D'];
const iconSequence = [...icons, ...[...icons].reverse()];

// Text list
const texts = [
  '完成中', '执行中', '实现中', '烘焙中', '处理中', '酝酿中',
  '计算中', '思考中', '引导中', '搅拌中', '运作中', '融合中',
  '冥思中', '计算中', '组合中', '调配中', '考虑中', '深思中',
  '烹饪中', '制作中', '创建中', '处理中', '解密中', '斟酌中',
  '确定中', '重组中', '进行中', '实施中', '阐明中', '施法中',
  '构想中', '操作中', '筹划中', '锻造中', '成型中', '嬉戏中',
  '生成中', '萌芽中', '孵化中', '聚集中', '鸣笛中', '构思中',
  '想象中', '孵化中', '推断中', '显现中', '腌制中', '漫步中',
  '闲逛中', '琢磨中', '集结中', '沉思中', '酝酿中', '渗透中',
  '细读中', '哲思中', '阐述中', '思索中', '处理中', '摆弄中',
  '困惑中', '网格化中', '反刍中', '谋划中', '拖曳中', '摇摆中',
  '炖煮中', '挤压中', '探险中', '旋转中', '炖煮中', '探究中',
  '综合中', '思维中', '修补中', '转化中', '展开中', '解开中',
  '共鸣中', '游荡中', '呼呼作响中', '晃动中', '工作中', '争论中'
];

const maxTextLength = Math.max(...texts.map(t => t.length));

function randomText(): string {
  return texts[Math.floor(Math.random() * texts.length)];
}

function padText(text: string, length: number): string {
  return (text + '...').padEnd(length + 3, ' ');
}

export const WaitingIndicator = memo(function WaitingIndicator({
  size = 16,
  permissionMode = 'default'
}: WaitingIndicatorProps) {
  const [currentIcon, setCurrentIcon] = useState(iconSequence[0]);
  const [currentText, setCurrentText] = useState(() => padText(randomText(), maxTextLength));

  const iconIndexRef = useRef(0);
  const textChangeCountRef = useRef(0);

  // Icon animation
  useEffect(() => {
    const iconTimer = setInterval(() => {
      iconIndexRef.current = (iconIndexRef.current + 1) % iconSequence.length;
      setCurrentIcon(iconSequence[iconIndexRef.current]);
    }, 120);

    return () => clearInterval(iconTimer);
  }, []);

  // Text animation
  useEffect(() => {
    let textTimer: number;

    const updateText = () => {
      textChangeCountRef.current++;
      setCurrentText(padText(randomText(), maxTextLength));

      const delays = [2000, 3000, 5000];
      const delay = textChangeCountRef.current < delays.length
        ? delays[textChangeCountRef.current]
        : 5000;

      textTimer = window.setTimeout(updateText, delay);
    };

    textTimer = window.setTimeout(updateText, 2000);

    return () => {
      if (textTimer) clearTimeout(textTimer);
    };
  }, []);

  return (
    <div
      className={styles.waitingIndicator}
      data-permission-mode={permissionMode}
    >
      <span
        className={styles.icon}
        style={{ fontSize: `${size}px` }}
      >
        {currentIcon}
      </span>
      <span className={styles.text}>{currentText}</span>
    </div>
  );
});

export default WaitingIndicator;
