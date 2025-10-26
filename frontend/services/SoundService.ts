// CORS issues with soundjay.com - sounds disabled
// import { Howl } from 'howler';

export const soundService = {
  playPhaseChange: () => {
    // Disabled due to CORS issues
    // const sound = new Howl({
    //   src: ['https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3']
    // });
    // sound.play();
  },

  playVote: () => {
    // Disabled due to CORS issues
    // const sound = new Howl({
    //   src: ['https://www.soundjay.com/misc/sounds/button-21.mp3']
    // });
    // sound.play();
  },

  playMessage: () => {
    // Disabled due to CORS issues
    // const sound = new Howl({
    //   src: ['https://www.soundjay.com/misc/sounds/speech-to-text-01.mp3']
    // });
    // sound.play();
  }
};
