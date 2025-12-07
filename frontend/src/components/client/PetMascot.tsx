import Image from 'next/image';
import { useEffect, useState } from 'react';
import styles from "@/css/PetMascot.module.css"

interface PetMascotProps {
  message?: string;
}

export default function PetMascot({ message }: PetMascotProps) {
  const [displayed, setDisplayed] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isWaving, setIsWaving] = useState(false);

  useEffect(() => {
    if (!message) {
      setDisplayed('');
      return;
    }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (i >= message.length) {
          clearInterval(interval);
          return prev;
        }
        const next = message.slice(0, i + 1);
        i++;
        return next;
      });
    }, 18); // tốc độ gõ, chỉnh nếu muốn nhanh/chậm hơn
    return () => clearInterval(interval);
  }, [message]);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180); // thời gian nhắm mắt
    };
    const interval = setInterval(blink, 3000); // chớp mắt mỗi 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!displayed || displayed.length >= (message?.length || 0)) {
      setIsTalking(false);
      return;
    }
    let talking = true;
    const interval = setInterval(() => {
      talking = !talking;
      setIsTalking(talking);
    }, 180);
    return () => {
      setIsTalking(false);
      clearInterval(interval);
    };
  }, [displayed, message]);

  useEffect(() => {
    let waving = false;
    const interval = setInterval(() => {
      waving = !waving;
      setIsWaving(waving);
    }, 350); // tốc độ vẫy cánh
    return () => clearInterval(interval);
  }, []);

  let imgSrc = "/images/ga-con.png";
  if (isBlinking) {
    imgSrc = "/images/ga-con-nham-mat.png";
  } else if (isTalking) {
    imgSrc = "/images/ga-con-mo-mieng.png";
  } else if (isWaving) {
    imgSrc = "/images/ga-con-vay-canh.png";
  }

  return (
    <div className={styles['pet-chat-wrapper']}>
      <Image
        src={imgSrc}
        alt="Gà Con"
        width={72}
        height={72}
        className={styles['pet-avatar']}
      />
      <div className={styles['pet-bubble']}>
        <span className={styles['gradient-text']}>
          {displayed}
        </span>
        {displayed.length < (message?.length || 0) && <span style={{opacity:0.7}}>|</span>}
      </div>
    </div>
  );
} 