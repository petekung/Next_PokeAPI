// battle.js - Core battle logic

export class Pokemon {
    constructor(name, type, hp, attack, defense, spAttack, spDefense, speed, moves, id) {
        this.name = name;
        this.type = type;
        this.maxHp = hp;
        this.currentHp = hp;
        this.attack = attack;
        this.defense = defense;
        this.spAttack = spAttack;
        this.spDefense = spDefense;
        this.speed = speed;
        this.moves = moves; // Array of move objects
        this.id = id; // New: Pokemon ID
        this.frontSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        this.backSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
        this.status = null; // e.g., 'poison', 'burn', 'paralysis'
        this.statStages = { // Stat multipliers based on stages
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0,
            speed: 0
        };
    }

    takeDamage(damage) {
        this.currentHp -= damage;
        if (this.currentHp < 0) {
            this.currentHp = 0;
        }
    }

    isFainted() {
        return this.currentHp === 0;
    }

    // Apply status effect
    applyStatus(status) {
        this.status = status;
        console.log(`${this.name} is ${status}!`);
    }

    // Change stat stage
    changeStatStage(stat, stages) {
        this.statStages[stat] += stages;
        // Cap stages between -6 and +6
        if (this.statStages[stat] > 6) this.statStages[stat] = 6;
        if (this.statStages[stat] < -6) this.statStages[stat] = -6;
        console.log(`${this.name}'s ${stat} changed by ${stages} stages.`);
    }

    getStat(statName) {
        const baseStat = this[statName];
        const stage = this.statStages[statName];
        let multiplier = 1;

        if (stage > 0) {
            multiplier = (2 + stage) / 2;
        } else if (stage < 0) {
            multiplier = 2 / (2 - stage);
        }
        return Math.floor(baseStat * multiplier);
    }
}

export class Move {
    constructor(name, type, power, accuracy, category, effect = null) {
        this.name = name;
        this.type = type;
        this.power = power;
        this.accuracy = accuracy; // 0-100
        this.category = category; // 'physical', 'special', 'status'
        this.effect = effect; // Function for status effects or stat changes
    }
}

// Type effectiveness chart (simplified for now)
const typeEffectiveness = {
    'fire': {
        'grass': 2,
        'water': 0.5
    },
    'water': {
        'fire': 2,
        'grass': 0.5
    },
    'grass': {
        'water': 2,
        'fire': 0.5
    },
    // Add more types as needed
};

function calculateDamage(attacker, move, defender) {
    if (move.category === 'status') {
        return 0; // Status moves don't deal direct damage
    }

    const attackStat = move.category === 'physical' ? attacker.getStat('attack') : attacker.getStat('spAttack');
    const defenseStat = move.category === 'physical' ? defender.getStat('defense') : defender.getStat('spDefense');

    let damage = ((((2 * 50 / 5 + 2) * attackStat * move.power / defenseStat) / 50) + 2);

    // Type effectiveness
    const effectiveness = typeEffectiveness[move.type]?.[defender.type] || 1;
    damage *= effectiveness;

    // STAB (Same-Type Attack Bonus)
    if (attacker.type === move.type) {
        damage *= 1.5;
    }

    // Critical hit (simplified 1/16 chance)
    const isCritical = Math.random() < 1 / 16;
    if (isCritical) {
        damage *= 1.5;
        console.log("A critical hit!");
    }

    // Random variance
    damage *= (Math.random() * (1 - 0.85) + 0.85); // 0.85 to 1.0

    return Math.floor(damage);
}

// Battle class to manage the battle flow
export class Battle {
    constructor(playerPokemon, opponentPokemon, battleUI, battleAI) {
        this.playerPokemon = playerPokemon;
        this.opponentPokemon = opponentPokemon;
        this.turn = 0;
        this.activePlayerPokemon = playerPokemon[0];
        this.activeOpponentPokemon = opponentPokemon[0];
        this.battleLog = [];
        this.battleUI = battleUI;
        this.battleAI = battleAI;
        this.playerMovePromiseResolve = null;
    }

    log(message) {
        this.battleLog.push(message);
        if (this.battleUI) {
            this.battleUI.displayMessage(message);
        }
        console.log(message); // For debugging
    }

    playerChooseMove() {
        return new Promise(resolve => {
            this.playerMovePromiseResolve = resolve;
            this.battleUI.showCommandMenu();
            this.battleUI.displayMoves(this.activePlayerPokemon.moves); // Display player's moves
        });
    }

    setPlayerMove(move) {
        if (this.playerMovePromiseResolve) {
            this.playerMovePromiseResolve(move);
            this.playerMovePromiseResolve = null;
        }
    }

    async start() {
        this.log("Battle started!");
        this.log(`Player sent out ${this.activePlayerPokemon.name}!`);
        this.log(`Opponent sent out ${this.activeOpponentPokemon.name}!`);
        this.battleUI.updatePokemonDisplay(this.activePlayerPokemon, this.activeOpponentPokemon);

        while (!this.activePlayerPokemon.isFainted() && !this.activeOpponentPokemon.isFainted()) {
            this.turn++;
            this.log(`--- Turn ${this.turn} ---`);

            // Player chooses move
            const playerMove = await this.playerChooseMove();
            this.battleUI.hideCommandMenu();

            // AI chooses move
            const opponentMove = this.battleAI.chooseMove(this.activeOpponentPokemon, this.activePlayerPokemon);

            let firstAttacker, secondAttacker;
            let firstMove, secondMove;

            if (this.activePlayerPokemon.speed >= this.activeOpponentPokemon.speed) {
                firstAttacker = this.activePlayerPokemon;
                secondAttacker = this.activeOpponentPokemon;
                firstMove = playerMove;
                secondMove = opponentMove;
            } else {
                firstAttacker = this.activeOpponentPokemon;
                secondAttacker = this.activePlayerPokemon;
                firstMove = opponentMove;
                secondMove = playerMove;
            }

            // First attacker's turn
            if (!firstAttacker.isFainted()) {
                const target = (firstAttacker === this.activePlayerPokemon) ? this.activeOpponentPokemon : this.activePlayerPokemon;
                this.log(`${firstAttacker.name} used ${firstMove.name}!`);
                this.battleUI.playAttackAnimation(firstAttacker, target);
                this.executeMove(firstAttacker, firstMove, target);
                this.battleUI.updatePokemonDisplay(this.activePlayerPokemon, this.activeOpponentPokemon);
                if (target.isFainted()) {
                    this.log(`${target.name} fainted!`);
                    break; // Battle ends if target faints
                }
            }

            // Second attacker's turn (if not fainted)
            if (!secondAttacker.isFainted()) {
                const target = (secondAttacker === this.activePlayerPokemon) ? this.activeOpponentPokemon : this.activePlayerPokemon;
                this.log(`${secondAttacker.name} used ${secondMove.name}!`);
                this.battleUI.playAttackAnimation(secondAttacker, target);
                this.executeMove(secondAttacker, secondMove, target);
                this.battleUI.updatePokemonDisplay(this.activePlayerPokemon, this.activeOpponentPokemon);
                if (target.isFainted()) {
                    this.log(`${target.name} fainted!`);
                    break; // Battle ends if target faints
                }
            }

            // Apply status effects at end of turn (e.g., poison damage)
            this.applyEndOfTurnEffects(this.activePlayerPokemon);
            this.applyEndOfTurnEffects(this.activeOpponentPokemon);
            this.battleUI.updatePokemonDisplay(this.activePlayerPokemon, this.activeOpponentPokemon);
        }

        this.log("Battle ended!");
        if (this.activePlayerPokemon.isFainted()) {
            this.log("You lost the battle!");
        } else {
            this.log("You won the battle!");
        }
    }

    executeMove(attacker, move, defender) {
        // Check accuracy
        if (Math.random() * 100 > move.accuracy) {
            this.log(`${attacker.name}'s attack missed!`);
            return;
        }

        if (move.category === 'status') {
            // Apply status effect or stat change
            if (move.effect) {
                move.effect(defender);
            }
        } else {
            const damage = calculateDamage(attacker, move, defender);
            defender.takeDamage(damage);
            this.log(`${defender.name} took ${damage} damage! (${defender.currentHp}/${defender.maxHp} HP remaining)`);
            this.battleUI.playDamageAnimation(defender);
        }
    }

    applyEndOfTurnEffects(pokemon) {
        if (pokemon.status === 'poison') {
            const poisonDamage = Math.floor(pokemon.maxHp / 8); // Example: 1/8 of max HP
            pokemon.takeDamage(poisonDamage);
            this.log(`${pokemon.name} is hurt by poison! (${pokemon.currentHp}/${pokemon.maxHp} HP remaining)`);
        }
        // Add other status effects like burn, paralysis, etc.
    }
}

// Example Usage (for testing)
// const tackle = new Move('Tackle', 'normal', 40, 100, 'physical');
// const ember = new Move('Ember', 'fire', 40, 100, 'special');
// const waterGun = new Move('Water Gun', 'water', 40, 100, 'special');
// const growl = new Move('Growl', 'normal', 0, 100, 'status', (target) => target.changeStatStage('attack', -1));
// const poisonSting = new Move('Poison Sting', 'poison', 15, 100, 'physical', (target) => {
//     if (Math.random() < 0.3) target.applyStatus('poison'); // 30% chance to poison
// });

// const charmander = new Pokemon('Charmander', 'fire', 39, 52, 43, 60, 50, 65, [ember, tackle]);
// const squirtle = new Pokemon('Squirtle', 'water', 44, 48, 65, 50, 64, 43, [waterGun, tackle]);
// const bulbasaur = new Pokemon('Bulbasaur', 'grass', 45, 49, 49, 65, 65, 45, [tackle, growl, poisonSting]);

// const battle = new Battle([charmander], [squirtle]);
// battle.start();
