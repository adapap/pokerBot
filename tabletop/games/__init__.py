import tabletop
from tabletop.games import TheMind
from types import ModuleType
from typing import List
GameCollection = List[ModuleType]
games: GameCollection = [TheMind]

# To-do:
# Handle events to be executed by game instances?

class Game:
    """ABC which handles the creation of game instances.
    Games are required to implement the following:
    - name (property)
    - description (property)
    - on_start (method)
    - on_stop (method)"""
    @property
    def name(self):
        """The name of the game."""
        raise NotImplementedError

    @property
    def description(self):
        """A short description of the game."""
        raise NotImplementedError
    
    async def on_start(self):
        """Event handler for when the game is started.

        Use to setup player/game state as well as base mechanics."""
        raise NotImplementedError
    
    async def on_stop(self):
        """Event handler for when the game is stopped.
        
        Use to clear and reset the game state."""
        raise NotImplementedError

    def __init__(self, client: tabletop.Client):
        self._client = client
