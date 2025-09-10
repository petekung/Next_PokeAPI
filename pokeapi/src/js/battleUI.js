// battleUI.js - Handles battle user interface updates

export class BattleUI {
    constructor() {
        this.battleScreen = document.getElementById('battle-screen');
        this.playerPokemonName = document.getElementById('player-pokemon-name');
        this.playerPokemonHp = document.getElementById('player-pokemon-hp');
        this.playerPokemonHpBar = document.getElementById('player-pokemon-hp-bar');
        this.playerPokemonSprite = document.getElementById('player-pokemon-sprite'); // New
        this.opponentPokemonName = document.getElementById('opponent-pokemon-name');
        this.opponentPokemonHp = document.getElementById('opponent-pokemon-hp');
        this.opponentPokemonHpBar = document.getElementById('opponent-pokemon-hp-bar');
        this.opponentPokemonSprite = document.getElementById('opponent-pokemon-sprite'); // New
        this.messageDisplay = document.getElementById('battle-message');
        this.commandMenu = document.getElementById('command-menu');
        this.movesContainer = document.getElementById('moves-container'); // New element
        this.attackButton = document.getElementById('attack-button');
        this.switchButton = document.getElementById('switch-button');
        this.itemButton = document.getElementById('item-button');
        this.runButton = document.getElementById('run-button');

        this.battleInstance = null; // To hold the Battle instance

        this.attackButton.addEventListener('click', () => this.onAttackClick());
        this.movesContainer.addEventListener('click', (e) => this.handleMoveSelection(e));
        // Add event listeners for other buttons
    }

    setBattleInstance(battle) {
        this.battleInstance = battle;
    }

    showBattleScreen() {
        this.battleScreen.style.display = 'block';
    }

    hideBattleScreen() {
        this.battleScreen.style.display = 'none';
    }

    updatePokemonDisplay(playerPokemon, opponentPokemon) {
        this.playerPokemonName.textContent = playerPokemon.name;
        this.playerPokemonHp.textContent = `${playerPokemon.currentHp}/${playerPokemon.maxHp} HP`;
        this.playerPokemonHpBar.style.width = `${(playerPokemon.currentHp / playerPokemon.maxHp) * 100}%`;
        this.playerPokemonSprite.src = playerPokemon.backSprite; // Set player sprite

        this.opponentPokemonName.textContent = opponentPokemon.name;
        this.opponentPokemonHp.textContent = `${opponentPokemon.currentHp}/${opponentPokemon.maxHp} HP`;
        this.opponentPokemonHpBar.style.width = `${(opponentPokemon.currentHp / opponentPokemon.maxHp) * 100}%`;
        this.opponentPokemonSprite.src = opponentPokemon.frontSprite; // Set opponent sprite
    }

    displayMessage(message) {
        this.messageDisplay.textContent = message;
    }

    showCommandMenu() {
        this.commandMenu.style.display = 'block';
        this.movesContainer.style.display = 'none'; // Hide moves when command menu is shown
    }

    hideCommandMenu() {
        this.commandMenu.style.display = 'none';
    }

    onAttackClick() {
        this.displayMessage("Choose an attack!");
        this.hideCommandMenu();
        this.movesContainer.style.display = 'grid'; // Show moves
    }

    displayMoves(moves) {
        this.movesContainer.innerHTML = ''; // Clear previous moves
        moves.forEach(move => {
            const moveButton = document.createElement('button');
            moveButton.classList.add('btn', 'btn-outline-primary', 'w-100', 'move-button');
            moveButton.textContent = move.name;
            moveButton.dataset.moveName = move.name; // Store move name for identification
            this.movesContainer.appendChild(moveButton);
        });
    }

    handleMoveSelection(e) {
        const target = e.target.closest('.move-button');
        if (target) {
            const moveName = target.dataset.moveName;
            const selectedMove = this.battleInstance.activePlayerPokemon.moves.find(move => move.name === moveName);
            if (selectedMove) {
                this.hideMoves();
                this.battleInstance.setPlayerMove(selectedMove);
            }
        }
    }

    hideMoves() {
        this.movesContainer.innerHTML = '';
        this.movesContainer.style.display = 'none';
    }

    // Placeholder for animations
    playAttackAnimation(attacker, defender) {
        console.log(`${attacker.name} attacks ${defender.name} with animation!`);
        // Implement actual visual animation here
    }

    playDamageAnimation(pokemon) {
        console.log(`${pokemon.name} takes damage animation!`);
        // Implement actual visual animation here
    }
}
