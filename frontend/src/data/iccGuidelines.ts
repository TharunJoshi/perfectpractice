// ICC Playing Handbook Guidelines for PerfectPractice App
// Based on ICC Playing Conditions 2025-26

export const ICC_GUIDELINES = {
  // Official Warm-up Protocols (ICC Standard)
  warmup: {
    duration: 10, // minutes
    phases: [
      {
        name: 'Light Cardio',
        duration: 3,
        description: 'Jogging, high knees, butt kicks to raise heart rate',
        exercises: [
          'Light jogging around the pitch',
          'High knees (30 seconds)',
          'Butt kicks (30 seconds)',
          'Side shuffles (30 seconds each direction)',
        ],
      },
      {
        name: 'Dynamic Stretching',
        duration: 4,
        description: 'Movement-based stretches to prepare muscles',
        exercises: [
          'Leg swings (front to back) - 10 each leg',
          'Leg swings (side to side) - 10 each leg',
          'Walking lunges with twist - 10 each side',
          'Arm circles (small to large) - 20 seconds',
          'Torso rotations - 10 each direction',
        ],
      },
      {
        name: 'Cricket-Specific Activation',
        duration: 3,
        description: 'Sport-specific movements to prime the body',
        exercises: [
          'Shadow batting swings - 10 repetitions',
          'Bowling run-up practice (no ball)',
          'Quick sprints (10m) x 3',
          'Catching simulation jumps',
        ],
      },
    ],
  },

  // Cool-down Protocol
  cooldown: {
    duration: 10,
    phases: [
      {
        name: 'Active Recovery',
        duration: 3,
        description: 'Gradually lower heart rate',
        exercises: [
          'Slow jogging (2 minutes)',
          'Walking (1 minute)',
        ],
      },
      {
        name: 'Static Stretching',
        duration: 5,
        description: 'Hold stretches to improve flexibility',
        exercises: [
          'Hamstring stretch - 30 seconds each leg',
          'Quadriceps stretch - 30 seconds each leg',
          'Calf stretch - 30 seconds each leg',
          'Shoulder stretch - 30 seconds each arm',
          'Triceps stretch - 30 seconds each arm',
          'Lower back stretch - 30 seconds',
          'Hip flexor stretch - 30 seconds each side',
        ],
      },
      {
        name: 'Breathing & Recovery',
        duration: 2,
        description: 'Deep breathing and mental recovery',
        exercises: [
          'Deep breathing exercises (4-7-8 technique)',
          'Mental session review',
        ],
      },
    ],
  },

  // Batting Techniques (ICC Standard)
  battingTechniques: {
    stance: {
      name: 'Batting Stance',
      keyPoints: [
        'Feet shoulder-width apart',
        'Weight evenly distributed on balls of feet',
        'Knees slightly bent for balance',
        'Eyes level and focused on bowler',
        'Bat resting behind back foot',
        'Top hand grip firm, bottom hand relaxed',
        'Head still and over the ball line',
      ],
      commonFaults: [
        'Standing too upright',
        'Weight on heels',
        'Gripping bat too tightly',
        'Head falling to off-side',
      ],
    },
    grip: {
      name: 'Bat Grip',
      keyPoints: [
        'V formed by thumb and forefinger pointing between splice and outside edge',
        'Hands close together on handle',
        'Top hand dominant for control',
        'Bottom hand for power generation',
        'Fingers wrapped around, not too tight',
      ],
    },
    shots: {
      defensive: [
        {
          name: 'Forward Defense',
          description: 'Block ball with soft hands, bat close to pad',
          keyPoints: [
            'Lead with front foot towards pitch of ball',
            'Bat comes down straight',
            'Soft hands to deaden ball',
            'Head over front knee',
          ],
        },
        {
          name: 'Back Foot Defense',
          description: 'Play short balls on back foot',
          keyPoints: [
            'Transfer weight onto back foot',
            'Keep bat close to body',
            'Play ball under eyes',
            'Maintain balance',
          ],
        },
      ],
      attacking: [
        {
          name: 'Cover Drive',
          description: 'Classic off-side shot through cover region',
          keyPoints: [
            'Front foot to pitch of ball',
            'Full face of bat to ball',
            'High elbow through shot',
            'Follow through towards cover',
            'Head still, eyes on ball',
          ],
        },
        {
          name: 'Straight Drive',
          description: 'Hit ball straight back past bowler',
          keyPoints: [
            'Get to pitch of ball',
            'Bat swing straight down the line',
            'Weight transfer to front foot',
            'Full follow through',
          ],
        },
        {
          name: 'Pull Shot',
          description: 'Horizontal bat shot for short-pitched balls',
          keyPoints: [
            'Back and across to get in line',
            'Roll wrists over ball',
            'Hit ball in front of body',
            'Keep eyes on ball',
          ],
        },
        {
          name: 'Cut Shot',
          description: 'Square cut for short wide deliveries',
          keyPoints: [
            'Back foot movement to off-side',
            'Arms away from body',
            'Hit ball late, under eyes',
            'Roll wrists for control',
          ],
        },
      ],
    },
  },

  // Bowling Techniques (ICC Standard)
  bowlingTechniques: {
    fastBowling: {
      runUp: {
        keyPoints: [
          'Consistent run-up length (measured and marked)',
          'Gradual acceleration towards crease',
          'Smooth rhythm throughout',
          'Eyes focused on target',
        ],
      },
      action: {
        keyPoints: [
          'High arm action (within 15° flexion - ICC legal limit)',
          'Front arm pulls down to generate pace',
          'Strong front leg brace',
          'Hip and shoulder rotation aligned',
          'Follow through towards target',
        ],
        legalRequirements: [
          'Arm must not straighten more than 15 degrees during delivery',
          'Back foot must land within return crease',
          'Front foot must land behind popping crease',
          'No throwing action permitted',
        ],
      },
      deliveries: [
        { name: 'Outswinger', description: 'Ball moves away from right-handed batsman' },
        { name: 'Inswinger', description: 'Ball moves into right-handed batsman' },
        { name: 'Bouncer', description: 'Short-pitched delivery targeting body/head' },
        { name: 'Yorker', description: 'Full delivery targeting batsman\'s toes' },
        { name: 'Slower Ball', description: 'Deceptive change of pace' },
      ],
    },
    spinBowling: {
      offSpin: {
        keyPoints: [
          'Fingers across seam for spin',
          'Use of front foot pivot',
          'Flight and loop for deception',
          'Arm ball variation',
        ],
      },
      legSpin: {
        keyPoints: [
          'Wrist position for turn',
          'Strong shoulder rotation',
          'Variations: googly, flipper, slider',
          'Consistent release point',
        ],
      },
    },
  },

  // Fielding Techniques
  fieldingTechniques: {
    catching: {
      highCatch: [
        'Get under the ball early',
        'Watch ball into hands',
        'Soft hands to cushion',
        'Fingers pointing up for high catches',
      ],
      slip: [
        'Low, balanced stance',
        'Weight on balls of feet',
        'Hands together, fingers down',
        'React and watch ball in',
      ],
      outfield: [
        'Judge trajectory early',
        'Move quickly to position',
        'Set under ball with time to spare',
        'Two hands when possible',
      ],
    },
    groundFielding: {
      keyPoints: [
        'Attack the ball',
        'Get body behind ball',
        'Low center of gravity',
        'Quick release to keeper/bowler',
      ],
    },
    throwing: {
      keyPoints: [
        'Side-on position',
        'Strong base leg',
        'Arm follows through to target',
        'Hit top of stumps',
      ],
    },
  },

  // Safety Guidelines (ICC Standard)
  safetyGuidelines: {
    equipment: {
      batting: [
        'Helmet mandatory for facing pace bowling (ICC Standard approved)',
        'Helmet must have faceguard attached',
        'Pads must cover knee and shin',
        'Gloves with adequate padding',
        'Box/abdominal guard mandatory',
        'Arm guard recommended for pace bowling',
        'Thigh pad recommended',
        'Chest guard recommended',
      ],
      wicketKeeping: [
        'Wicketkeeping gloves with proper webbing',
        'Inner gloves for protection',
        'Pads lighter than batting pads',
        'Helmet mandatory when standing up to stumps',
      ],
      fielding: [
        'Helmet required for close-in fielders (short leg, silly point)',
        'Shin guards for close fielders optional',
      ],
    },
    practiceArea: [
      'Ensure adequate space between nets',
      'Check pitch surface for cracks or damage',
      'Adequate lighting for visibility',
      'First aid kit accessible',
      'Hydration available',
      'No unauthorized persons in bowling run-up area',
    ],
    heatGuidelines: [
      'Regular hydration breaks every 15-20 minutes',
      'Shade available during rest periods',
      'Monitor for signs of heat exhaustion',
      'Reduce intensity in extreme heat (>35°C)',
    ],
  },

  // 2025-26 Rule Changes
  ruleChanges2025: [
    {
      rule: 'Stop Clock',
      description: 'Fielding team must start next over within 60 seconds',
      penalty: '5-run penalty after 2 warnings',
      format: 'Tests (expanding from white-ball)',
      effectiveDate: 'June 2025',
    },
    {
      rule: 'Concussion Substitutes',
      description: 'Teams nominate 5 like-for-like candidates pre-toss',
      details: '7-day stand-down for diagnosed cases',
      format: 'All formats',
      effectiveDate: 'June/July 2025',
    },
    {
      rule: 'Boundary Catches',
      description: 'Airborne contact beyond boundary invalid unless fielder lands wholly inside',
      format: 'All formats',
      effectiveDate: 'October 2025 (trial)',
    },
    {
      rule: 'DRS Enhancements',
      description: 'Reviews follow chronological order of events',
      details: 'Wicket zone is stumps/bails outline; no-balls assessed independently',
      format: 'All formats',
      effectiveDate: 'June/July 2025',
    },
    {
      rule: 'Deliberate Short Runs',
      description: '5-run penalty added; fielding team chooses next striker',
      format: 'All formats',
      effectiveDate: 'June/July 2025',
    },
    {
      rule: 'ODI Ball Usage',
      description: 'Two new balls used until over 34; one selected for overs 35-50',
      format: 'ODIs',
      effectiveDate: 'July 2025',
    },
  ],

  // Practice Session Structure (ICC Recommended)
  sessionStructure: {
    beginner: {
      totalDuration: 60,
      breakdown: [
        { phase: 'Warm-up', duration: 10, percentage: 17 },
        { phase: 'Skill Drills', duration: 25, percentage: 42 },
        { phase: 'Match Simulation', duration: 15, percentage: 25 },
        { phase: 'Cool-down', duration: 10, percentage: 16 },
      ],
    },
    intermediate: {
      totalDuration: 90,
      breakdown: [
        { phase: 'Warm-up', duration: 10, percentage: 11 },
        { phase: 'Technical Drills', duration: 35, percentage: 39 },
        { phase: 'Match Simulation', duration: 30, percentage: 33 },
        { phase: 'Fitness', duration: 5, percentage: 6 },
        { phase: 'Cool-down', duration: 10, percentage: 11 },
      ],
    },
    advanced: {
      totalDuration: 120,
      breakdown: [
        { phase: 'Warm-up', duration: 15, percentage: 12 },
        { phase: 'Technical Refinement', duration: 40, percentage: 33 },
        { phase: 'Match Simulation', duration: 40, percentage: 33 },
        { phase: 'Fitness/Conditioning', duration: 15, percentage: 13 },
        { phase: 'Cool-down', duration: 10, percentage: 9 },
      ],
    },
  },

  // AI Feedback Criteria based on ICC Standards
  aiFeedbackCriteria: {
    batting: {
      stance: ['balance', 'head_position', 'grip', 'backlift'],
      technique: ['footwork', 'bat_swing_path', 'follow_through', 'timing'],
      safety: ['helmet_usage', 'protective_gear'],
    },
    bowling: {
      action: ['arm_angle', 'front_arm', 'run_up_rhythm', 'follow_through'],
      legality: ['elbow_flexion', 'front_foot_landing', 'back_foot_position'],
      safety: ['run_up_clearance', 'delivery_stride'],
    },
    fielding: {
      catching: ['hand_position', 'body_position', 'eye_on_ball'],
      throwing: ['technique', 'accuracy', 'release_point'],
      ground: ['approach', 'pickup', 'throw_speed'],
    },
  },
};

// Format-specific playing conditions
export const FORMAT_CONDITIONS = {
  test: {
    overs: 'Unlimited (minimum 90 per day)',
    innings: 2,
    powerplay: 'N/A',
    fielding_restrictions: 'Maximum 2 fielders behind square on leg side',
    new_ball: 'Available after 80 overs',
    drs_reviews: 2,
  },
  odi: {
    overs: 50,
    innings: 1,
    powerplay: {
      P1: { overs: '1-10', fielders_outside_circle: 2 },
      P2: { overs: '11-40', fielders_outside_circle: 4 },
      P3: { overs: '41-50', fielders_outside_circle: 5 },
    },
    new_ball: 'Two balls from each end (2025 rule)',
    drs_reviews: 2,
  },
  t20: {
    overs: 20,
    innings: 1,
    powerplay: {
      P1: { overs: '1-6', fielders_outside_circle: 2 },
    },
    fielding_restrictions: 'Maximum 5 fielders outside circle after powerplay',
    drs_reviews: 2,
  },
};

export default ICC_GUIDELINES;
