var PLAYERS = [];
var CURRENT_PLAYER = 0;

function make_scoreboard() {
    let s = '<ol>';
    for (let i = 0; i < PLAYERS.length; i++) {
        let p = PLAYERS[i];
        s += '<li class="player';
        if (!p.alive) {
            s += ' dead';
        }
        if (i == CURRENT_PLAYER) {
            s += ' active';
        }
        s += '"><span class="player-name">'+p.name+'</span> ';
        s += '<span class="player-location">'+p.location+'</span> ';
        s += '<span class="player-score">'+p.glory+'</span>';
        if (p.skip > 0) {
            s += ' missing the next <span class="turn-count">'+p.skip+'</span> turns';
        }
        s += '</li>';
    }
    s += '</ol>';
    $('#score-board').html(s);
}

function oxford_comma(ls) {
    if (ls.length < 2) {
        return ls.join('');
    } else if (ls.length == 2) {
        return ls.join(' and ');
    } else {
        let ret = '';
        for (let i = 0; i < ls.length; i++) {
            if (i == 0) {
            } else if (i == ls.length-1) {
                ret += ', and ';
            } else {
                ret += ', ';
            }
            ret += ls[i];
        }
        return ret;
    }
}

function make_result(blob) {
    let ret = '<div class="action-result">';
    if (blob.hasOwnProperty('text')) {
        ret += '<span class="action-text">'+blob.text+'</span>';
    }
    if (blob.hasOwnProperty('roll')) {
        ret += '<span>Roll a die</span><ul><li><b>even:</b>';
        ret += make_result(blob.roll.even);
        ret += '</li><li><b>odd:</b>';
        ret += make_result(blob.roll.odd);
        ret += '</li><ul>';
    } else if (blob.hasOwnProperty('battle')) {
        ret += '<span>Roll two dice</span><ul><li><b>yours is higher:</b>';
        ret += make_result(blob.battle.win);
        ret += '</li><li><b>the other person\'s is lower:</b>';
        ret += make_result(blob.battle.lose);
        ret += '</li><ul>';
    } else {
        let ls = [];
        if (blob.hasOwnProperty('glory')) {
            if (blob.glory < 0) {
                ls.push('<span class="lost-glory">lose <span class="glory">'+(-blob.glory)+'</span> glory</span>');
            } else {
                ls.push('<span class="gain-glory">gain <span class="glory">'+(blob.glory)+'</span> glory</span>');
            }
        }
        if (blob.hasOwnProperty('go')) {
            ls.push('<span class="travel">go to <span class="destination">'+blob.go+'</span></span>');
        }
        if (blob.hasOwnProperty('skip')) {
            ls.push('<span class="skip">skip your next <span class="turn-count">'+blob.skip+'</span> turns</span>');
        }
        if (blob.hasOwnProperty('die') && blob.die) {
            ls.push('<span class="die">die</span>');
        }
        if (!ls.length) {
            ls.push('<span class="nothing">nothing happens</span>');
        }
        ret += oxford_comma(ls);
    }
    ret += '</div>';
    return ret;
}

function name() {
    return PLAYERS[CURRENT_PLAYER].name;
}

function roll_d6() {
    return 1 + Math.floor(Math.random() * 6);
}

function roll_die() {
    let n = roll_d6();
    let eo = (n % 2 == 0 ? 'even' : 'odd');
    alert(name() + ' rolled ' + n + ' (' + eo + ')');
    return eo;
}

function battle() {
    let me = roll_d6();
    let them = roll_d6();
    if (me == them) {
        alert('You both rolled '+me+'. Rerolling...');
        return battle();
    } else if (me < them) {
        alert('You rolled '+me+' and they rolled '+them+'. You lose.');
        return 'lose';
    } else {
        alert('You rolled '+me+' and they rolled '+them+'. You win.');
        return 'win';
    }
}

function apply_action(blob) {
    if (blob.hasOwnProperty('battle')) {
        apply_action(blob.battle[battle()]);
    } else if (blob.hasOwnProperty('roll')) {
        apply_action(blob.roll[roll_die()]);
    } else {
        if (blob.hasOwnProperty('glory')) {
            PLAYERS[CURRENT_PLAYER].glory += blob.glory;
            if (PLAYERS[CURRENT_PLAYER].glory < 0) {
                PLAYERS[CURRENT_PLAYER].glory = 0;
            }
        }
        if (blob.hasOwnProperty('go')) {
            PLAYERS[CURRENT_PLAYER].location = blob.go;
        }
        if (blob.hasOwnProperty('death') && blob.death) {
            PLAYERS[CURRENT_PLAYER].alive = false;
        }
        if (blob.hasOwnProperty('skip')) {
            PLAYERS[CURRENT_PLAYER].skip += blob.skip;
        }
    }
}

function choose_action() {
    let choice_idx = parseInt($(this).attr('data-idx'));
    let card_idx = parseInt($('#card-display').attr('data-card'));
    let card = CARDS[PLAYERS[CURRENT_PLAYER].location].cards[card_idx];
    let choice = card.choices[choice_idx];
    let loc = PLAYERS[CURRENT_PLAYER].location;
    apply_action(choice);
    CARDS[loc].cards.splice(card_idx, 1);
    finish_turn();
}

function inc_player() {
    CURRENT_PLAYER = (CURRENT_PLAYER + 1) % PLAYERS.length;
    if (!PLAYERS[CURRENT_PLAYER].alive) {
        inc_player();
    } else if (PLAYERS[CURRENT_PLAYER].skip > 0) {
        PLAYERS[CURRENT_PLAYER].skip--;
        inc_player();
    }
}

function finish_turn() {
    $('#card-display').html('');
    inc_player();
    make_scoreboard();
    if (!check_victory()) {
        start_turn();
    }
}

function display_card(idx) {
    let blob = CARDS[PLAYERS[CURRENT_PLAYER].location].cards[idx];
    let c = '<p class="intro-text">'+blob.intro+'</p>';
    for (let i = 0; i < blob.choices.length; i++) {
        c += '<div class="card-choice" data-idx="'+i+'">';
        c += make_result(blob.choices[i]);
        c += '</div>';
    }
    $('#card-display').html(c);
    $('#card-display').attr('data-card', idx);
    $('.card-choice').click(choose_action);
}

function rand_idx(ls) {
    return Math.floor(Math.random() * ls.length);
}

function relocate() {
    let possible = [];
    for (let k in CARDS) {
        if (CARDS[k].cards.length) {
            possible.push(k);
        }
    }
    let i = rand_idx(possible);
    let p = PLAYERS[CURRENT_PLAYER];
    alert('Moving '+p.name+' from '+p.location+' to '+possible[i]+' due to lack of cards.');
    PLAYERS[CURRENT_PLAYER].location = possible[i];
    make_scoreboard();
}

function start_turn() {
    let p = PLAYERS[CURRENT_PLAYER];
    if (!CARDS[p.location].cards.length) {
        relocate();
    }
    display_card(rand_idx(CARDS[p.location].cards));
}

function check_victory() {
    let alive = 0;
    PLAYERS.forEach(function(p) {
        if (p.alive) {
            alive++;
        }
    });
    let cards = 0;
    for (let p in CARDS) {
        cards += CARDS[p].cards.length;
    }
    if (alive <= 1 || cards == 0) {
        // TODO: ties
        let mp = 0;
        let mg = -Infinity;
        for (let i = 0; i < PLAYERS.length; i++) {
            if (PLAYERS[i].glory > mg) {
                mp = i;
                mg = PLAYERS[i].glory;
            }
        }
        alert(PLAYERS[mp].name + ' wins with '+mg+' glory!');
        return true;
    }
    return false;
}

function start_game() {
    let names = get_player_names();
    for (let i = 0; i < names.length; i++) {
        PLAYERS.push({
            name: names[i] || ('Player '+(i+1)),
            glory: 3,
            location: 'Wildfell Castle',
            alive: true,
            skip: 0
        });
    }
    $('#player-input').html('');
    make_scoreboard();
    start_turn();
}

function get_player_names() {
    let ret = [];
    $('#player-name-input').find('input').each(function() {
        ret.push(this.value || '');
    });
    return ret;
}

function change_player_count() {
    let num_players = parseInt($('#num-players').val());
    let player_names = get_player_names();
    let s = '';
    for (let i = 0; i < num_players; i++) {
        s += '<li><input type="text" value="'+(player_names[i]||'Player '+(i+1))+'"></input></li>';
    }
    $('#player-name-input').html(s);
}

function setup_get_players() {
    $('#player-input').html(
        'Number of players: <input type="number" min="2" value="2" id="num-players"></input><ol id="player-name-input"></ol><button id="begin-game">Play</button>'
    );
    $('#num-players').change(change_player_count);
    change_player_count();
    $('#begin-game').click(start_game);
}

setup_get_players();
