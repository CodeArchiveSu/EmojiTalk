import React, { useState, useEffect, useRef } from "react";
import "../../App.css";

// Define interfaces for Treat and its properties
interface Treat {
  el: HTMLDivElement;
  absolutePosition: { x: number; y: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  mass: number;
  radius: number;
  restitution: number;
  lifetime: number;
  direction: number;
  animating: boolean;
  remove: () => void;
  animate: () => void;
  checkBounds: () => void;
  update: () => void;
}

// 👀👻✨💬🧡
const treatmojis = ["💛", "👀", "🥕", "👻", "🍎", "🤪", "🚀", "🧃", "💧"];
const radius = 15;
const Cd = 0.7; // Dimensionless
const rho = 1.22; // kg / m^3
const A = (Math.PI * radius * radius) / 10000; // m^2
const ag = 9.81; // m / s^2
const frameRate = 1 / 60;

// const ag = 5;  // 중력 가속도 줄이기
// const Cd = 0.6;

const TreatsButton: React.FC = () => {
  // text-wrapper 요소의 크기를 추적하는 상태
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const updateDimensions = () => {
      if (elWrapperRef.current) {
        const { offsetWidth, offsetHeight } = elWrapperRef.current;
        setWidth(offsetWidth);
        setHeight(offsetHeight);
      }
    };

    // 컴포넌트가 마운트될 때 크기를 초기화하고, 윈도우 리사이즈 시에도 크기 업데이트
    updateDimensions(); // 초기 크기 설정
    window.addEventListener("resize", updateDimensions);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []); // 빈 배열을 사용하여 컴포넌트가 처음 마운트될 때만 실행

  // const [width, setWidth] = useState<number>(window.innerWidth);
  // const [height, setHeight] = useState<number>(window.innerHeight);
  const elWrapperRef = useRef<HTMLDivElement | null>(null);

  // Ref to store the list of treats
  const treatsRef = useRef<Treat[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getRandomArbitrary = (min: number, max: number): number =>
    Math.random() * (max - min) + min;
  const getRandomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const createTreat = (): Treat => {
    const vx = getRandomArbitrary(-10, 10); // x velocity
    const vy = getRandomArbitrary(-10, 1); // y velocity

    const el = document.createElement("div");
    el.className = "treat";

    const inner = document.createElement("span");
    inner.className = "inner";
    inner.innerText = treatmojis[getRandomInt(0, treatmojis.length - 1)];
    el.appendChild(inner);

    if (elWrapperRef.current) {
      elWrapperRef.current.appendChild(el);
    }

    const rect = el.getBoundingClientRect();
    const lifetime = getRandomArbitrary(4000, 5000);

    el.style.setProperty("--lifetime", lifetime.toString());

    const treat: Treat = {
      el,
      absolutePosition: { x: rect.left, y: rect.top },
      position: { x: rect.left, y: rect.top },
      velocity: { x: vx, y: vy },
      mass: 0.1, //kg
      radius: el.offsetWidth, // 1px = 1cm
      restitution: -0.7,
      lifetime,
      direction: vx > 0 ? 1 : -1,
      animating: true,
      remove() {
        this.animating = false;
        this.el.parentNode?.removeChild(this.el);
      },
      animate() {
        let Fx =
          (-0.5 *
            Cd *
            A *
            rho *
            this.velocity.x *
            this.velocity.x *
            this.velocity.x) /
          Math.abs(this.velocity.x);
        let Fy =
          (-0.5 *
            Cd *
            A *
            rho *
            this.velocity.y *
            this.velocity.y *
            this.velocity.y) /
          Math.abs(this.velocity.y);

        Fx = isNaN(Fx) ? 0 : Fx;
        Fy = isNaN(Fy) ? 0 : Fy;

        // Calculate acceleration ( F = ma )
        const ax = Fx / this.mass;
        const ay = ag + Fy / this.mass;

        // Integrate to get velocity
        this.velocity.x += ax * frameRate;
        this.velocity.y += ay * frameRate;

        // Integrate to get position
        this.position.x += this.velocity.x * frameRate * 100;
        this.position.y += this.velocity.y * frameRate * 100;

        this.checkBounds();
        this.update();
      },
      checkBounds() {
        if (this.position.y > height - this.radius) {
          this.velocity.y *= this.restitution;
          this.position.y = height - this.radius;
        }
        if (this.position.x > width - this.radius) {
          this.velocity.x *= this.restitution;
          this.position.x = width - this.radius;
          this.direction = -1;
        }
        if (this.position.x < this.radius) {
          this.velocity.x *= this.restitution;
          this.position.x = this.radius;
          this.direction = 1;
        }
      },
      update() {
        const relX = this.position.x - this.absolutePosition.x;
        const relY = this.position.y - this.absolutePosition.y;

        this.el.style.setProperty("--x", relX.toString());
        this.el.style.setProperty("--y", relY.toString());
        this.el.style.setProperty("--direction", this.direction.toString());
      },
    };

    setTimeout(() => {
      treat.remove();
    }, lifetime);

    return treat;
  };

  const animationLoop = () => {
    // Create a copy of treatsRef and filter out non-animating treats
    treatsRef.current = treatsRef.current.filter((treat) => treat.animating);

    treatsRef.current.forEach((treat) => treat.animate());

    requestAnimationFrame(animationLoop);
  };

  useEffect(() => {
    // Start animation loop once
    animationLoop();
  }, []);

  const addTreats = () => {
    if (treatsRef.current.length > 40) {
      return;
    }

    // Directly push new treats into treatsRef
    for (let i = 0; i < 20; i++) {
      const newTreat = createTreat();
      treatsRef.current.push(newTreat);
      newTreat.el && elWrapperRef.current?.appendChild(newTreat.el);
    }
  };

  return (
    <>
      <button className="treat-button" onClick={addTreats}>
        🧨
      </button>
      <div className="treat-wrapper" ref={elWrapperRef}></div>
    </>
  );
};

export default TreatsButton;
