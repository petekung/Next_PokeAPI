// battleAI.js - Opponent AI logic

export class BattleAI {
    constructor(opponentPokemon) {
        this.opponentPokemon = opponentPokemon;
    }

    chooseMove(activeOpponentPokemon, activePlayerPokemon) {
        // Simple AI: always choose the first move for now
        // In a more complex AI, it would consider:
        // - Type effectiveness
        // - Damage calculation
        // - Status effects
        // - Opponent's current HP
        // - Its own HP
        // - Stat changes
        return activeOpponentPokemon.moves[0];
    }

    choosePokemonToSwitch(faintedPokemon, availablePokemon) {
        // Simple AI: always switch to the first available non-fainted Pokemon
        for (const pokemon of availablePokemon) {
            if (!pokemon.isFainted()) {
                return pokemon;
            }
        }
        return null; // No available Pokemon to switch to
    }
}
