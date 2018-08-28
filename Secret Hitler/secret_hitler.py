from cards import *
from game import Game
from utils import EmbedColor

from itertools import cycle
from random import shuffle, choice, sample
# import packages from parent dir

# Temporary modules
from string import ascii_uppercase as alphabet


class SecretHitler(Game):
	"""
	Secret Hitler is a card game...
	"""
	def __init__(self, *, name: str):
		super().__init__(name=name)

		# Adding test players, should replace with a proper player join mechanic
		self.players = []
		for x in alphabet[:5]:
			self.add_player(x)

		# Keeps track of enacted policies
		self.board = {
			'fascist': 0,
			'liberal': 0
		}

		# Create an iterator that cycles every game loop (when action is valid)
		# For example, "election" can be a stage
		self.stages = cycle(['nomination', 'election', 'president', 'chancellor', 'summary'])
		self.next_stage = lambda: next(stages)
		self.stage = self.next_stage()
		
		self.president = None
		self.chancellor = None
		self.prev_president = None
		self.prev_chancellor = None
		self.nominee = None
		self.generate_deck()

		self.rounds = 0

	"""
	Property which gives number of policy cards in the deck
	"""
	@property
	def policy_count(self):
		return len(self.policy_deck)

	"""
	Generates a deck of policy cards
	"""
	def generate_deck(self):
		# There are 6 fascist policies and 11 liberal policies in a deck
		# If the deck is emptied, reshuffle the deck without the board cards
		self.policy_deck = []
		self.policy_deck.extend([PolicyCard(card_type="fascist", img_src="")] * (11 - self.board['fascist']))
		self.policy_deck.extend([PolicyCard(card_type="liberal", img_src="")] * (6 - self.board['liberal']))
		shuffle(self.policy_deck)

	"""
	Handles nominating a chancellor. Is a dummy function that just chooses a random player right now
	"""
	def choose_chancellor(self, *, president):
		valid = set(self.players) - set([president])
		if self.prev_president:
			valid -= set([self.prev_president])
		if self.prev_chancellor:
			valid -= set([self.prev_chancellor])
		return choice(list(valid))

	"""
	Handles getting voting results. Is a dummy function that just returns true/false right now
	"""
	def get_voting_results(self):
		return choice((True, False,))

	"""
	Handles getting the President's chosen policies. Is a dummy function that just chooses two random policies now
	"""
	def pick_chosen_policies(self, policies):
		return sample(policies, 2)

	"""
	Handles getting the Chancellor's chosen policy. Is a dummy function that just chooses a random policy now
	"""
	def get_enacted_policy(self, chosen_policies):
		return choice(chosen_policies)

	"""
	Handles the turn-by-turn logic of the game
	"""

	def tick(self):
		if self.stage == 'nomination':
			self.president = self.next_player()
			self.send_message(f'{president.name} is the President now! They must nominate a Chancellor.')

			# Rewrite this into proper chancellor choosing function
			self.nominee = self.choose_chancellor(president=president)
			if nominee == self.prev_president or nominee == self.prev_chancellor:
				self.send_message('You may not nominate the previous President, previous Chancellor, or yourself!', color=EmbedColor.ERROR)
				continue

			message = f'{nominee.name} has been nominated to be the Chancellor!'
			self.send_message(message)
			######

		if self.stage == 'election':
			voting_results = self.get_voting_results()

			if voting_results:
				chancellor = nominee
				message = 'The Chancellor was voted in!'
				self.send_message(message, color=EmbedColor.SUCCESS)

				policies = [self.policy_deck.pop() for _ in range(3)]

				message = '<' + ', '.join([policy.card_type.title() for policy in policies]) + '> Pick 2 policies to send to the Chancellor.'
				self.send_message(message, channel=president.dm_channel)

			else:
				self.send_message('The Chancellor was voted down!', color=EmbedColor.WARN)
				for _ in range(3):
					self.next_stage()
				self.tick()

		if self.stage == 'president':
			candidate_policies = self.pick_chosen_policies(policies)
			message = '<' + ', '.join([policy.card_type.title() for policy in candidate_policies]) + '> Choose a policy to enact.'
			self.send_message(message, channel=chancellor.dm_channel)

		if self.stage == 'chancellor':
			enacted_policy = choice(candidate_policies)

			self.board[enacted_policy.card_type] += 1
			self.send_message(f'A {enacted_policy.card_type} policy was passed!')

		if self.stage == 'summary':
			if self.board['liberal'] == 5:
				self.send_message('Five liberal policies have been passed, and the Liberals win!')
				return

			if self.board['fascist'] == 6:
				self.send_message('Six liberal policies have been passed, and the Fascists win!')
				return

			# Redundant message, show image of board progress
			message = f'{self.board["liberal"]} liberal policies and {self.board["fascist"]} fascist policies have been passed.'
			self.send_message(message)

			if self.policy_count < 3:
				self.generate_deck()
				self.send_message('As the deck had less than three policies remaining, the deck has been reshuffled.', color=EmbedColor.INFO)

			self.prev_chancellor = chancellor
			self.prev_president = president

			self.rounds += 1
			self.next_stage()
			self.tick()
			print('\n' * 3)


	"""
	Randomly assigns identities to players (Hitler, Liberal, Fascist, etc.)
	"""
	def assign_identities(self):
		identities = ['Hitler']
		# Add appropriate fascists depending on player count
		identities.extend(['Fascist'] * ((self.player_count - 3) // 2))
		# Remaining identities are filled with liberals
		identities.extend(['Liberal'] * ((self.player_count - len(identities))))
		shuffle(identities)
		
		# Indicate what identity a player has and inform related parties
		fascists = []
		hitler = None
		for player, identity in zip(self.players, identities):
			player.identity = identity
			if identity == 'Hitler':
				hitler = player
			elif identity == 'Fascist':
				fascists.append(player)
			self.send_message(f'You are a {identity}.', channel=player.dm_channel)
		for fascist in fascists:
			team = [f.name for f in fascists if f.name != fascist.name]
			if len(team):
				team = 'The other fascists are:\n' + '\n'.join(team)
			else:
				team = 'You are the only fascist'
			message = f'{team}\n{hitler.name} is Hitler'
			self.send_message(message, channel=fascist.dm_channel)
		if len(fascists) == 1:
			message = f'{fascists[0].name} is a fascist'
			self.send_message(message, channel=hitler.dm_channel)


	"""
	Checks if the game can start and assigns roles to players
	"""
	def start_game(self):
		if not 5 <= self.player_count <= 10:
			self.send_message("You must have between 5-10 players to start the game.", EmbedColor.ERROR)
			return
		self.assign_identities()

		# Creates an iterator which cycles through the next player
		self.player_cycle = cycle(self.players)
		self.next_player = lambda: next(self.player_cycle)

		# Runs the current stage of the game
		self.tick()


if __name__ == "__main__":
	game = SecretHitler(name='Secret Hitler')
	# while game.player_count < 3:
	# 	name = input('Player name: ')
	# 	game.add_player(name)
	game.start_game()