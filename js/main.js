import 'regenerator-runtime/runtime';
import image from '/img/arm.png';
import balaklava from '/img/balaklava.jpg';
import pblk from '/img/pblk.png';
import trash from '/img/trash.png';
import quest from '/img/quest.png';
import zvuk from '/audio/zvuk.mp3';
import pisk from '/audio/pisk.wav';
import atmo from '/audio/atmo.mp3';

(function () {
  const API_HOST = "http://mystery.publikagaultier.com/api/";
  // const API_HOST = "http://localhost:8090/"
  let finish = false;
  let email = "not set";

  const items = [
      '<img src="' + balaklava + '">',
    '<img src="' + pblk + '">', '<img src="' + trash + '">',
    '<img src="' + balaklava + '">',
    '<img src="' + pblk + '">', '<img src="' + trash + '">', '<img src="' + quest + '">',
  ];
  const doors = document.querySelectorAll('.door');
  let isSpinning = false;

  document.querySelector('#slot').addEventListener('click', spin);
  document.querySelector('#slot').addEventListener('touchmove', spin);
  document.querySelector('#form').addEventListener('submit', submitEmail);
  /*document.querySelector('#reseter').addEventListener('click', init);*/

  let lastBones = ['<img src="' + trash + '">', '<img src="' + quest + '">', '<img src="' + balaklava + '">'];

  function init(firstInit = true, groups = 1, duration = 1, win = false) {
    const bones = [];
    let index = 0;
    for (const door of doors) {
      if (firstInit) {
        door.dataset.spinned = '0';
      } else if (door.dataset.spinned === '1') {
        // return;
      }

      const boxes = door.querySelector('.boxes');
      const boxesClone = boxes.cloneNode(false);
      const pool = [lastBones[index]];

      if (!firstInit) {
        const arr = [];
        for (let n = 0; n < (groups > 0 ? groups : 1); n++) {
          arr.push(...items);
        }
        if(win){
          pool.push(...arr);
        }else {
          pool.push(...shuffle(arr));
          bones.push(pool[pool.length - 1]);
        }

        boxesClone.addEventListener(
          'transitionstart',
          function () {
            door.dataset.spinned = '1';
            this.querySelectorAll('.box').forEach((box) => {
              // box.style.filter = 'blur(1px)';
            });
          },
          { once: true }
        );

        boxesClone.addEventListener(
          'transitionend',
          function () {
            this.querySelectorAll('.box').forEach((box, index) => {
              box.style.filter = 'blur(0)';
              setTimeout(()=>{
                box.style.filter = 'blur(0)';
              }, 0);
              if (index > 0) this.removeChild(box);
            });
          },
          { once: true }
        );
      }

      for (let i = pool.length - 1; i >= 0; i--) {
        const box = document.createElement('div');
        box.classList.add('box');
        box.style.width = door.clientWidth + 'px';
        box.style.height = door.clientHeight + 'px';
        box.innerHTML = pool[i];
        boxesClone.appendChild(box);
      }
      boxesClone.style.transitionDuration = `${duration > 0 ? duration : 1}s`;
      boxesClone.style.transform = `translateY(-${door.clientHeight * (pool.length - 1)}px)`;
      door.replaceChild(boxesClone, boxes);
      index++;
    }
    if(!firstInit){
      if(!win && bones[0] == bones[1] & bones[1] == bones[2]) {
        init(firstInit, groups, duration, win);
        return
      }
      lastBones = [bones[0],bones[1],bones[2]]
    }
  }

  async function spin() {
    if(isSpinning || finish){
      return;
    }
    /* var audio = new Audio(pisk);
    audio.play(); */
    document.querySelector('.arm').classList.add("active");
    isSpinning = true;
    let response = await fetch( API_HOST + "lottery", { method: "POST", body:  JSON.stringify({email: email })})
    response = await response.json()

    init(false, 3, 1, !!response.code);

    for (const door of doors) {
      const boxes = door.querySelector('.boxes');
      const duration = parseInt(boxes.style.transitionDuration);
      boxes.style.transform = 'translateY(0)';
      await new Promise((resolve) => setTimeout(resolve, duration * 100));
    }
    setTimeout(()=>{
      isSpinning = false;
      // audio.play();
    },1000);
    document.querySelector('.arm').classList.remove("active");
    if(response.code){
      finish = true;
      onWin(response.code);
    }
  }

  function shuffle([...arr]) {
    let m = arr.length;
    while (m) {
      const i = Math.floor(Math.random() * m--);
      [arr[m], arr[i]] = [arr[i], arr[m]];
    }
    return arr;
  }

  async function submitEmail(e) {
    e.preventDefault();
    var audio = new Audio(atmo);
    audio.attributes
    audio.play();

    audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);

    document.querySelector('#email').classList.remove("error");
    if(validateEmail(document.querySelector('#email').value)) {
      email = document.querySelector('#email').value;
      document.querySelector('#form').remove();
      document.querySelector('#overlay').classList.remove('visible');
      let response = await fetch(API_HOST + "email", { method: "POST", body:  JSON.stringify({email: email })})
      await response.text()
    }else{
      document.querySelector('#email').classList.add("error");
    }
  }

  function onWin(code){
    setTimeout(async function () {
      document.body.classList.add("win");
      document.getElementById("mystery").textContent = "PROMOCODE: \n" + code;

      let response = await fetch( API_HOST + "win", { method: "POST", body:  code})
      response = await response.text()

    }, 1000);
  }

  function validateEmail(email){
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  init();
})();

