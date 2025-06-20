import { gsap } from "gsap";
import { ExpoScaleEase } from "gsap/EasePack";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrambleTextPlugin, ExpoScaleEase);

const charSets = {
  cosmeticsTitle: "🖌️🎨🖍️👨‍🎨",
  backpacksTitle: "💧🌊☔💦🫗",
  citbTitle: "🏆🥇🚀🔒👑🧠",
  bakaTitle: "🏆🚀👑💀🔚🗑️",
  default: "upperAndLowerCase",
};

export function initializeTitleAnimation() {
  const titles = document.getElementsByClassName("acid-title");
  if (!titles.length) return;

  const animations = Array.from(titles).map((title) => {
    const animation = gsap.to(title, {
      duration: 3,
      scrambleText: {
        delay: 0.5,
        text: "{original}",
        chars: charSets[title.id] || charSets.default,
        revealDelay: 1,
        speed: 0.3,
        tweenLength: true,
        ease: "slow(0.7, 0.7, false)",
      },
    });

    title.onclick = () => animation.restart(true);

    return animation;
  });

  return animations;
}

export function initializeHeroTitleAnimation() {
  const heroTitle = document.getElementById("heroTitle");
  if (!heroTitle) {
    console.error("Hero title element not found");
    return;
  }
}
