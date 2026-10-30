import { Entity } from '../../entities/Entity';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import type { PlayableTeam } from '../../teams/teams.types';

/** Test fixture for the future Structure family; production has no BuffTower entity yet. */
export class TestBuffTower extends Entity {
  public readonly kind = 'buff-tower';
  /** Creates a fixture with a real entity identity and owning team. */
  public constructor(
    id: string,
    private readonly team: PlayableTeam,
    public readonly family = 'structure',
  ) {
    super(id, 'buff-tower');
  }
  protected installComponents(): void {
    this.addComponent(new Health(100));
    this.addComponent(new TeamMembership(this.team));
  }
}
