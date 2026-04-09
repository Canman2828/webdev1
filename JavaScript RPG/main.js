'use strict';

let gameData = null;
let player = null;
let currentEnemy = null;
let currentLocation = null;
let battleActive = false;
let skillUsedThisBattle = false;

class Character {
    constructor(name, health, attackPower, defense, level = 1) {
        this.name = name;
        this.maxHealth = health;
        this.health = health;
        this.attackPower = attackPower;
        this.defense = defense;
        this.level = level;
    }

    attack(target) {
        function calcDamage(atk, def) {
            const base = Math.max(1, atk - def);
            const roll = Math.floor(Math.random() * 6) - 2; // -2 to +3 variance
            return Math.max(1, base + roll);
        }
        const dmg = calcDamage(this.attackPower, target.defense);
        target.takeDamage(dmg);
        return dmg;
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
    }

    heal(amount) {
        const computeActual = () => Math.min(amount, this.maxHealth - this.health);
        const actual = computeActual();
        this.health = Math.min(this.maxHealth, this.health + amount);
        return actual;
    }

    levelUp() {
        const applyBoosts = () => {
            this.maxHealth += 15;
            this.health = this.maxHealth;
            this.attackPower += 3;
            this.defense += 1;
        };
        this.level++;
        applyBoosts();
    }

    isAlive() { return this.health > 0; }
}

class Player extends Character {
    constructor(name, classData) {
        super(name, classData.health, classData.attackPower, classData.defense, 1);
        this.classType = classData.class;
        this.skillName = classData.skill;
        this.inventory = new Inventory();   
        this.gold = 200;
        this.xp = 0;
        this.xpToLevel = 50;
        this.equippedWeapon = null;
        this.equippedArmor = null;
    }

    get totalAttack(){return this.attackPower + (this.equippedWeapon ? this.equippedWeapon.power   : 0); }
    get totalDefense(){return this.defense + (this.equippedArmor  ? this.equippedArmor.defense  : 0); }

    attack(target) {
        function calcDamage(atk, def) {
            const base = Math.max(1, atk - def);
            const roll = Math.floor(Math.random() * 6) - 2;
            return Math.max(1, base + roll);
        }
        const dmg = calcDamage(this.totalAttack, target.defense);
        target.takeDamage(dmg);
        return dmg;
    }

    skill(target) {
        const powerStrike = () => {
            const dmg = Math.floor(this.totalAttack * 1.8);
            target.takeDamage(dmg);
            return { dmg, msg: `${this.name} unleashes a devastating Power Strike for ${dmg} damage!` };
        };
        const fireball = () => {
            const dmg = Math.floor(this.totalAttack * 2.0);
            target.takeDamage(dmg);
            return { dmg, msg: `${this.name} hurls a blazing Fireball for ${dmg} damage!` };
        };
        const backstab = () => {
            const dmg = Math.floor(this.totalAttack * 1.5 + 15);
            target.takeDamage(dmg);
            return { dmg, msg: `${this.name} vanishes and Backstabs for ${dmg} damage!` };
        };
        const arrowStorm = () => {
            const dmg = Math.floor(this.totalAttack * 1.6);
            target.takeDamage(dmg);
            return { dmg, msg: `${this.name} unleashes Arrow Storm for ${dmg} damage!` };
        };

        const skillMap = {
            'Power Strike': powerStrike,
            'Fireball': fireball,
            'Backstab': backstab,
            'Arrow Storm': arrowStorm,
        };
        return (skillMap[this.skillName] || (() => ({ dmg: 0, msg: 'Nothing happened.' })))();
    }

    gainXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            this.levelUp();
            return true;
        }
        return false;
    }

    equipWeapon(weapon) { this.equippedWeapon = weapon; }
    equipArmor(armor)   { this.equippedArmor  = armor;  }

    toSaveData() {
        return {
            name: this.name,
            classType: this.classType,
            maxHealth: this.maxHealth,
            health: this.health,
            attackPower: this.attackPower,
            defense: this.defense,
            level: this.level,
            skillName: this.skillName,
            gold: this.gold,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            equippedWeapon: this.equippedWeapon,
            equippedArmor: this.equippedArmor,
            inventory: {
                weapons: this.inventory.weapons,
                armors: this.inventory.armors,
                potions: this.inventory.potions,
            },
        };
    }
}

class Enemy extends Character {
    constructor(data) {
        super(data.name, data.health, data.attackPower, data.defense);
        this.xpReward = data.xpReward || 20;
        this.goldReward = data.goldReward || 15;
        this.image = data.image || '';
    }

    skill(target) {
        function heavyBlow(base) { return Math.floor(base * 1.6); }
        const dmg = heavyBlow(this.attackPower);
        target.takeDamage(dmg);
        return dmg;
    }

    takeTurn(target) {
        const rollSkill = () => Math.random() < 0.25;
        if (rollSkill()) {
            const dmg = this.skill(target);
            return { dmg, isSkill: true };
        }
        const dmg = this.attack(target);
        return { dmg, isSkill: false };
    }
}

class Weapon {
    constructor(name, power, cost, image = '') {
        this.name = name;
        this.power = power;
        this.cost = cost;
        this.image = image;
    }
}


class Armor {
    constructor(name, defense, cost, image = '') {
        this.name = name;
        this.defense = defense;
        this.cost = cost;
        this.image = image;
    }
}

class Inventory {
    constructor() {
        this.weapons = [];
        this.armors = [];
        this.potions = 0;
    }

    addWeapon(weapon) { this.weapons.push(weapon); }
    addArmor(armor)   { this.armors.push(armor);   }
    addPotion() { this.potions++;             }

    usePotion(character) {
        const doHeal = () => {
            this.potions--;
            character.heal(50);
            return true;
        };
        return this.potions > 0 ? doHeal() : false;
    }
}

const CLASS_IMAGES = {
    Warrior: 'RPGImages/Warrior.webp',
    Mage: 'RPGImages/Mage.webp',
    Thief: 'RPGImages/Thief.webp',
    Archer: 'RPGImages/Archer.webp',
};

const CLASS_BATTLE_IMAGES = {
    Warrior: 'RPGImages/Warrior2.webp',
    Mage: 'RPGImages/Mage2.webp',
    Thief: 'RPGImages/Thief2.webp',
    Archer: 'RPGImages/Archer2.webp',
};

const CLASS_DESCRIPTIONS = {
    Warrior:'A mighty warrior',
    Mage:'A powerful spellcaster',
    Thief:'A nimble rogue who strikes from the shadows.',
    Archer: 'A skilled hunter with bow',
};

const LOCATION_IMAGES = {
    'Whispering Forest': 'RPGImages/SpookyForest.webp',
    'Castle Ruins':'RPGImages/Castle1.webp',
    'Mountain Cave':'RPGImages/Moutains.webp',
    'Village Market':'RPGImages/shop1.webp',
    'Enchanted Grove': 'RPGImages/MagicalForest.webp',
};

const ENEMY_IMAGES = {
    'Goblin':'RPGImages/Goblin.webp',
    'Troll':'RPGImages/Troll.webp',
    'Evil Soldier': 'RPGImages/evilSoldier.webp',
    'Soldier':'RPGImages/soldier.webp',
    'Dragon': 'RPGImages/Dragon.webp',
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    const el = document.getElementById(id);
    el.classList.remove('hidden');
    el.classList.add('active');
}
async function init() {
    try {
        const res = await fetch('data.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        gameData = await res.json();
        buildCharacterSelect();
    } catch (err) {
        document.body.innerHTML = `
          <div style="color:#c0392b;padding:50px;font-family:Georgia,serif;text-align:center;">
            <h2>Could not load game data</h2>
            <p style="margin-top:12px;">Open the game through a local server
               (e.g. the VS Code <strong>Live Server</strong> extension).</p>
            <p style="color:#888;font-size:.85rem;margin-top:8px;">${err.message}</p>
          </div>`;
    }
}

function buildCharacterSelect() {
    const container = document.getElementById('class-cards');
    container.innerHTML = '';

    gameData.playerClasses.forEach(cls => {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.innerHTML = `
            <img src="${CLASS_IMAGES[cls.class] || ''}" alt="${cls.class}">
            <h3>${cls.class}</h3>
            <p class="class-desc">${CLASS_DESCRIPTIONS[cls.class] || ''}</p>
            <div class="class-stats">
                <span>HP ${cls.health}</span>
                <span>ATK ${cls.attackPower}</span>
                <span>DEF ${cls.defense}</span>
            </div>
            <p class="skill-name">Skill: ${cls.skill}</p>
            <button class="btn-select-class" data-class="${cls.class}">Choose ${cls.class}</button>
        `;
        container.appendChild(card);
    });
    container.addEventListener('click', e => {
        const btn = e.target.closest('.btn-select-class');
        if (btn) selectClass(btn.dataset.class);
    });
}

function selectClass(className) {
    const rawName = document.getElementById('player-name').value.trim();
    const heroName = rawName || 'Hero';
    const classData = gameData.playerClasses.find(c => c.class === className);

    player = new Player(heroName, classData);
    player.inventory.addPotion(); // free starting potion

    showScreen('screen-world');
    showWorldMap();
}

function showWorldMap() {
    updateStatsPanel();
    setLocationImage('RPGImages/map1.webp');
    setStory('You stand at the crossroads of destiny. Choose a location to explore.');

    const btns = document.getElementById('action-buttons');
    btns.innerHTML = '<p class="loc-heading">Choose a Location:</p>';

    gameData.locations.forEach(loc => {
        const b = document.createElement('button');
        b.className = 'btn-location';
        b.textContent = loc.name;
        b.addEventListener('click', () => visitLocation(loc.name));
        btns.appendChild(b);
    });
}

function visitLocation(locationName) {
    currentLocation = gameData.locations.find(l => l.name === locationName);
    setLocationImage(LOCATION_IMAGES[locationName] || 'map1.webp');
    setStory(currentLocation.description);
    updateStatsPanel();
    clearActionButtons();

    if (locationName === 'Village Market') {
        showVillageChoices();
    } else if (locationName === 'Mountain Cave') {
        showMountainChoices();
    } else {
        showExploreChoices(locationName);
    }
}

function showExploreChoices(locationName) {
    clearActionButtons();
    addActionBtn('Engage Enemies','btn-action btn-red',    () => triggerBattle(locationName));
    addActionBtn('Explore the Area','btn-action btn-purple', () => exploreArea(locationName));
    addActionBtn('Return to World Map', 'btn-action btn-olive',  showWorldMap);
}

function showMountainChoices() {
    clearActionButtons();
    setStory('The Mountain Cave looms before you. Deep within, you hear the rhythmic breath of a Dragon...');
    addActionBtn('Challenge the Dragon','btn-action btn-red',    () => triggerBattle('Mountain Cave'));
    addActionBtn('Search for Treasure (Risky)','btn-action btn-purple', searchForTreasure);
    addActionBtn('Retreat from the Cave','btn-action btn-olive',  showWorldMap);
}

function showVillageChoices() {
    clearActionButtons();
    addActionBtn('Visit the Shop', 'btn-action btn-purple', openShop);
    addActionBtn('Rest at the Inn (30 gold, heal 50% HP)', 'btn-action btn-green',  restAtInn);
    addActionBtn('Leave the Village', 'btn-action btn-olive',  showWorldMap);
}

function exploreArea(locationName) {
    const roll = Math.random();

    if (roll < 0.35) {
        const gold = Math.floor(Math.random() * 30) + 10;
        player.gold += gold;
        setStory(`You search carefully and discover ${gold} gold coins hidden nearby!`);
    } else if (roll < 0.55) {
        player.inventory.addPotion();
        setStory('While exploring, you find a Health Potion tucked under some roots!');
    } else if (roll < 0.78) {
        const dmg = Math.floor(Math.random() * 15) + 5;
        player.takeDamage(dmg);
        setStory(`You trigger a hidden trap and take ${dmg} damage! Be more careful.`);
        if (!player.isAlive()) { playerDeath(); return; }
    } else {
        setStory('Enemies spot you and launch an ambush! Prepare to fight!');
        setTimeout(() => triggerBattle(locationName), 1400);
        return; 
    }

    updateStatsPanel();
    showExploreChoices(locationName);
}

function searchForTreasure() {
    const roll = Math.random();
    if (roll < 0.40) {
        const gold = Math.floor(Math.random() * 100) + 50;
        player.gold += gold;
        setStory(`You creep past the slumbering Dragon and pry open a chest — ${gold} gold!`);
        updateStatsPanel();
        showMountainChoices();
    } else if (roll < 0.65) {
        const dragonArmor = new Armor('Dragon Scale Armor', 15, 0, 'RPGImages/DragonArmor.webp');
        player.inventory.addArmor(dragonArmor);
        player.equipArmor(dragonArmor);
        setStory('You find legendary Dragon Scale Armor in the cave and quickly equip it!');
        updateStatsPanel();
        showMountainChoices();
    } else {
        setStory('The Dragon stirs — it spotted you! Brace for battle!');
        setTimeout(() => triggerBattle('Mountain Cave'), 1400);
    }
}

function restAtInn() {
    if (player.gold < 30) {
        setStory("You don't have enough gold to stay at the inn. You need at least 30 gold.");
        return;
    }
    if (player.health >= player.maxHealth) {
        setStory('You are already at full health! The innkeeper smiles and wishes you well.');
        return;
    }
    const healed = player.heal(Math.floor(player.maxHealth * 0.5));
    player.gold -= 30;
    setStory(`You rest at the inn and recover ${healed} HP. You feel refreshed.`);
    updateStatsPanel();
}

function triggerBattle(locationName) {
    const loc   = gameData.locations.find(l => l.name === locationName);
    const types = loc ? loc.enemyTypes : [];
    if (!types.length) return;

    const eName    = types[Math.floor(Math.random() * types.length)];
    const baseData = gameData.enemies.find(e => e.name === eName);

    const scaled = {
        ...baseData,
        health: Math.floor(baseData.health  * (1 + (player.level - 1) * 0.10)),
        attackPower: Math.floor(baseData.attackPower * (1 + (player.level - 1) * 0.05)),
        xpReward: Math.floor(25 * player.level),
        goldReward:  Math.floor(15 + player.level * 5),
        image: ENEMY_IMAGES[eName] || baseData.image || '',
    };

    currentEnemy = new Enemy(scaled);
    battleActive = true;
    skillUsedThisBattle = false;

    document.getElementById('player-battle-img').src = CLASS_BATTLE_IMAGES[player.classType] || CLASS_IMAGES[player.classType] || '';
    document.getElementById('player-battle-name').textContent = `${player.name} (Lv.${player.level})`;
    document.getElementById('enemy-battle-img').src = currentEnemy.image;
    document.getElementById('enemy-battle-name').textContent = currentEnemy.name;
    document.getElementById('btn-skill').textContent = `Skill: ${player.skillName}`;
    document.getElementById('btn-skill').disabled = false;

    setBattleButtonsEnabled(true);
    updateBattleStats();
    drawHealthBars();
    setBattleLog(`A wild ${currentEnemy.name} appears! What will you do?`);
    showScreen('screen-battle');
}

function playerAttack() {
    if (!battleActive) return;
    const dmg = player.attack(currentEnemy);
    setBattleLog(`${player.name} attacks ${currentEnemy.name} for ${dmg} damage!`);
    updateBattleStats();
    drawHealthBars();
    if (!currentEnemy.isAlive()) { battleWon(); return; }
    pauseActions();
    setTimeout(enemyTurn, 900);
}

function playerSkill() {
    if (!battleActive || skillUsedThisBattle) return;
    skillUsedThisBattle = true;
    document.getElementById('btn-skill').disabled = true;

    const result = player.skill(currentEnemy);
    setBattleLog(result.msg);
    updateBattleStats();
    drawHealthBars();
    if (!currentEnemy.isAlive()) { battleWon(); return; }
    pauseActions();
    setTimeout(enemyTurn, 900);
}

function playerPotion() {
    if (!battleActive) return;
    const used = player.inventory.usePotion(player);
    if (used) {
        setBattleLog(`${player.name} drinks a Health Potion and recovers 50 HP!`);
        updateBattleStats();
        drawHealthBars();
        pauseActions();
        setTimeout(enemyTurn, 900);
    } else {
        setBattleLog('You have no potions left!');
    }
}

function playerFlee() {
    if (!battleActive) return;
    if (Math.random() < 0.5) {
        battleActive = false;
        setBattleLog('You managed to escape from battle!');
        setTimeout(() => { showScreen('screen-world'); showWorldMap(); }, 1300);
    } else {
        setBattleLog('You failed to escape! The enemy attacks!');
        pauseActions();
        setTimeout(enemyTurn, 900);
    }
}

function enemyTurn() {
    if (!battleActive) return;
    resumeActions();

    const result = currentEnemy.takeTurn(player);
    if (result.isSkill) {
        setBattleLog(`${currentEnemy.name} uses a powerful special attack for ${result.dmg} damage!`);
    } else {
        setBattleLog(`${currentEnemy.name} attacks ${player.name} for ${result.dmg} damage!`);
    }

    updateBattleStats();
    drawHealthBars();
    if (!player.isAlive()) playerDeath();
}


function battleWon() {
    battleActive = false;
    setBattleButtonsEnabled(false);

    const levelled = player.gainXP(currentEnemy.xpReward);
    player.gold += currentEnemy.goldReward;

    let msg = `Victory! You defeated the ${currentEnemy.name}! Gained ${currentEnemy.xpReward} XP and ${currentEnemy.goldReward} gold.`;
    if (levelled) msg += ` LEVEL UP! You are now Level ${player.level}!`;

    setBattleLog(msg);
    updateBattleStats();
    drawHealthBars();

    setTimeout(() => {
        setBattleButtonsEnabled(true);
        showScreen('screen-world');
        if (currentLocation) visitLocation(currentLocation.name);
        else showWorldMap();
    }, 2800);
}

function playerDeath() {
    battleActive = false;
    setBattleButtonsEnabled(false);
    setBattleLog('You have been defeated... You wake up in the village, weakened and lighter in the pocket.');

    setTimeout(() => {
        player.gold = Math.max(0, player.gold - 25);
        player.health = Math.floor(player.maxHealth * 0.3);
        setBattleButtonsEnabled(true);
        showScreen('screen-world');
        setLocationImage(LOCATION_IMAGES['Village Market']);
        setStory('You were defeated and wake up in the village. You lost 25 gold and feel very weak. Rest before venturing out again!');
        showVillageChoices();
        updateStatsPanel();
    }, 3200);
}

function pauseActions() {
    ['btn-attack', 'btn-potion', 'btn-flee'].forEach(id => {
        document.getElementById(id).disabled = true;
    });
}

function resumeActions() {
    ['btn-attack', 'btn-potion', 'btn-flee'].forEach(id => {
        document.getElementById(id).disabled = false;
    });
    if (!skillUsedThisBattle) {
        document.getElementById('btn-skill').disabled = false;
    }
}

function setBattleButtonsEnabled(on) {
    ['btn-attack', 'btn-skill', 'btn-potion', 'btn-flee'].forEach(id => {
        document.getElementById(id).disabled = !on;
    });
}

function setBattleLog(msg) {
    document.getElementById('battle-log-text').textContent = msg;
}

function updateBattleStats() {
    document.getElementById('b-player-hp').textContent = `${player.health} / ${player.maxHealth}`;
    document.getElementById('b-player-atk').textContent = player.totalAttack;
    document.getElementById('b-player-def').textContent = player.totalDefense;
    document.getElementById('b-potions').textContent = player.inventory.potions;
    document.getElementById('b-enemy-hp').textContent = `${currentEnemy.health} / ${currentEnemy.maxHealth}`;
    document.getElementById('b-enemy-atk').textContent = currentEnemy.attackPower;
    document.getElementById('b-enemy-def').textContent = currentEnemy.defense;
}

function drawHealthBars() {
    const canvas = document.getElementById('battle-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    function drawBar(label, current, max, x, y, barW) {
        const pct = Math.max(0, Math.min(1, current / max));

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 12px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(`${label}   ${current} / ${max}`, x, y - 4);

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x, y, barW, 20);

        ctx.fillStyle = pct > 0.5 ? '#27ae60' : pct > 0.25 ? '#e67e22' : '#c0392b';
        ctx.fillRect(x, y, Math.floor(barW * pct), 20);

        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth   = 1.2;
        ctx.strokeRect(x, y, barW, 20);
    }

    const barW = Math.floor(W / 2 - 30);
    drawBar(player.name, player.health,player.maxHealth, 15,30, barW);
    drawBar(currentEnemy.name, currentEnemy.health, currentEnemy.maxHealth, W / 2 + 15, 30, barW);

    ctx.fillStyle = '#d4af37';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('\u2694', W / 2, 46);
}

function openShop() {
    renderShop();
    showScreen('screen-shop');
}

function renderShop() {
    document.getElementById('shop-gold-display').textContent = player.gold;

    const weapDiv = document.getElementById('shop-weapons');
    weapDiv.innerHTML = '';
    gameData.weapons.forEach(w => {
        const owned = player.inventory.weapons.some(pw => pw.name === w.name);
        const equipped = player.equippedWeapon && player.equippedWeapon.name === w.name;
        const btn = document.createElement('button');
        btn.className = 'shop-item-btn';
        btn.textContent = `${w.name}  +${w.power} ATK  —  ${w.cost} gold${owned ? '  [Owned]' : ''}${equipped ? '  [Equipped]' : ''}`;
        btn.disabled = owned || player.gold < w.cost;
        btn.addEventListener('click', () => buyWeapon(w));
        weapDiv.appendChild(btn);
    });

    const armDiv = document.getElementById('shop-armor');
    armDiv.innerHTML = '';
    gameData.armor.forEach(a => {
        const owned = player.inventory.armors.some(pa => pa.name === a.name);
        const equipped = player.equippedArmor && player.equippedArmor.name === a.name;
        const btn = document.createElement('button');
        btn.className = 'shop-item-btn';
        btn.textContent = `${a.name}  +${a.defense} DEF  —  ${a.cost} gold${owned ? '  [Owned]' : ''}${equipped ? '  [Equipped]' : ''}`;
        btn.disabled = owned || player.gold < a.cost;
        btn.addEventListener('click', () => buyArmor(a));
        armDiv.appendChild(btn);
    });
}

function buyWeapon(wData) {
    if (player.gold < wData.cost) return;
    const weapon = new Weapon(wData.name, wData.power, wData.cost, wData.image || '');
    player.gold -= wData.cost;
    player.inventory.addWeapon(weapon);
    player.equipWeapon(weapon);
    showNotification(`Equipped ${weapon.name}!`);
    renderShop();
    updateStatsPanel();
}

function buyArmor(aData) {
    if (player.gold < aData.cost) return;
    const armor = new Armor(aData.name, aData.defense, aData.cost, aData.image || '');
    player.gold -= aData.cost;
    player.inventory.addArmor(armor);
    player.equipArmor(armor);
    showNotification(`Equipped ${armor.name}!`);
    renderShop();
    updateStatsPanel();
}

function buyPotion() {
    if (player.gold < 50) { showNotification('Not enough gold!'); return; }
    player.gold -= 50;
    player.inventory.addPotion();
    showNotification('Health Potion added to inventory!');
    renderShop();
    updateStatsPanel();
}

function leaveShop() {
    showScreen('screen-world');
    visitLocation('Village Market');
}

function updateStatsPanel() {
    if (!player) return;
    document.getElementById('stats-portrait').src = CLASS_IMAGES[player.classType] || '';
    document.getElementById('stats-name').textContent = player.name;
    document.getElementById('stats-class').textContent = player.classType;
    document.getElementById('stats-level').textContent = player.level;
    document.getElementById('stats-hp').textContent = `${player.health} / ${player.maxHealth}`;
    document.getElementById('stats-attack').textContent = player.totalAttack;
    document.getElementById('stats-defense').textContent = player.totalDefense;
    document.getElementById('stats-gold').textContent = player.gold;
    document.getElementById('stats-xp').textContent = `${player.xp} / ${player.xpToLevel}`;
    document.getElementById('stats-weapon').textContent = player.equippedWeapon ? player.equippedWeapon.name : 'None';
    document.getElementById('stats-armor').textContent = player.equippedArmor  ? player.equippedArmor.name  : 'None';
    document.getElementById('stats-potions').textContent = player.inventory.potions;
}

function setStory(text){ document.getElementById('story-text').textContent  = text; }
function setLocationImage(src) { document.getElementById('location-img').src = src;  }

function clearActionButtons() { document.getElementById('action-buttons').innerHTML = ''; }

function addActionBtn(label, className, handler) {
    const btn = document.createElement('button');
    btn.className  = className;
    btn.textContent = label;
    btn.addEventListener('click', handler);
    document.getElementById('action-buttons').appendChild(btn);
}

function saveGame() {
    if (!player) { showNotification('Start a game first!'); return; }
    localStorage.setItem('fantasyQuestSave', JSON.stringify(player.toSaveData()));
    showNotification('Game saved!');
}

function loadGame() {
    const raw = localStorage.getItem('fantasyQuestSave');
    if (!raw)      { showNotification('No saved game found.');       return; }
    if (!gameData) { showNotification('Game data still loading...'); return; }

    const save = JSON.parse(raw);
    const fakeClass = {
        class:save.classType,
        health:save.maxHealth,    
        attackPower:save.attackPower,
        defense:save.defense,
        skill:save.skillName,
    };

    player = new Player(save.name, fakeClass);
    player.health = save.health;
    player.gold = save.gold;
    player.xp = save.xp;
    player.xpToLevel = save.xpToLevel;
    player.level = save.level;

    if (save.inventory) {
        save.inventory.weapons.forEach(w =>
            player.inventory.addWeapon(new Weapon(w.name, w.power, w.cost, w.image || '')));
        save.inventory.armors.forEach(a =>
            player.inventory.addArmor(new Armor(a.name, a.defense, a.cost, a.image || '')));
        player.inventory.potions = save.inventory.potions;
    }

    if (save.equippedWeapon) {
        const w = save.equippedWeapon;
        player.equipWeapon(new Weapon(w.name, w.power, w.cost, w.image || ''));
    }
    if (save.equippedArmor) {
        const a = save.equippedArmor;
        player.equipArmor(new Armor(a.name, a.defense, a.cost, a.image || ''));
    }

    showNotification(`Loaded: ${player.name} — Level ${player.level} ${player.classType}`);
    showScreen('screen-world');
    showWorldMap();
}

function showNotification(msg) {
    const el = document.createElement('div');
    el.className = 'game-notification';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2700);
}

document.getElementById('btn-save').addEventListener('click',   saveGame);
document.getElementById('btn-load').addEventListener('click',   loadGame);
document.getElementById('btn-attack').addEventListener('click', playerAttack);
document.getElementById('btn-skill').addEventListener('click',  playerSkill);
document.getElementById('btn-potion').addEventListener('click', playerPotion);
document.getElementById('btn-flee').addEventListener('click',   playerFlee);

init();
