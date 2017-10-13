'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

const Sysmsg = require('sysmsg');

let $greetings = {};
const fn = __dirname + '/greetings.yml';

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

function bypass(str) {
  return (str
    .replace(/w-w/gi, match => match.split('-').join('-<A></A>'))
    .replace(/w{3,}/gi, match => match.split('').join('<A></A>'))
  );
};

function parseYml(yml) {
  try {
    $greetings = yaml.safeLoad(yml);
    console.log('[Greetings] loaded greetings.yml');
  } catch (e) {
    console.error(e);
  }
};

function readGreetings() {
  fs.readFile(fn, { encoding: 'utf8' }, (err, data) => {
    if (err != null) {
      console.error(err);
    } else {
      parseYml(data);
    }
  });
}

readGreetings();

fs.watch(fn, event => {
  if (event === 'change') {
    readGreetings();
  }
});

module.exports = function Greetings(dispatch) {
  const sysmsg = new Sysmsg(dispatch);
  const players = {};
  let name = '';
  let waiting = false;

  function sendGreet(target) {
    const greetings = $greetings[name];
    if (!greetings) return;

    const greets = greetings[target] || greetings.__default;
    if (greets && greets.length > 0) {
      dispatch.toServer('cChat', {
        channel: 9,
        message: bypass(randomElement(greets)),
      });
    }
  };

  dispatch.hook('sLogin', function sLogin(event) {
    name = event.name;
  });

  dispatch.hook('cChat', function cChat(event) {
    if (event.channel === 9 && $greetings[name]) {
      return false;
    }
  });

  dispatch.hook('sSpawnUser', function sSpawnUser(event) {
    const id = event.cid.high + ',' + event.cid.low;
    players[id] = event.name;
  });

  dispatch.hook('sDespawnUser', function sDespawnUser(event) {
    const id = event.target.high + ',' + event.target.low;
    delete players[id];
  });

  dispatch.hook('cStartInstanceSkill', function cStartInstanceSkill(event) {
    if (event.skill === 0x0799A695) { // Personalized Greetings
      const greetings = $greetings[name];
      if (!greetings) return;

      if (event.targets.length === 0) {
        sendGreet('__miss');
      } else if (event.targets.length === 1) {
        const target = event.targets[0].target;
        const id = target.high + ',' + target.low;
        sendGreet(players[id]);
      } else {
        const unknown = event.targets.every(v => {
          const target = v.target;
          const id = target.high + ',' + target.low;
          const user = players[id];
          return !(user && greetings[user]);
        });
        if (unknown) {
          sendGreet(null);
        } else {
          waiting = true;
        }
      }
    }
  });

  sysmsg.on('smtFriendSendHello', function onSmtFriendSendHello(args) {
    if (waiting) {
      waiting = false;
      sendGreet(params['UserName']);
    }
  });
};
