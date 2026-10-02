<p class="eyebrow">Context</p>

## Older adults are losing access to the leisure activities that keep them active and connected.

<!-- **Scope of work** -->
![Figure 02: Selected quotes from the interview process](/assets/images/senda/senda-overview-timeline.svg "full")

**The brief**

> How might we help people aged 70+ access leisure activities more easily through a digital platform?

**Goal**

Help older adults participate more independently in leisure activities while creating value for institutions and the wider community.




<p class="eyebrow">Research</p>

## We assumed the problem was finding activities. Interviews with older adults proved us wrong 

This project arose from identifying the barriers this group faces in digital environments. The lack of accessible tools not only limits their autonomy but also their active participation in daily life.

Following an initial brainstorming session, we arrived at an initial hypothesis:

>People over the age of 70 with intellectual interests need a simple way to find affordable activities because they lack a common place they can turn to.

However, before moving into solution design, we needed to validate this assumption and understand the underlying problem.


### Understanding where digital processes break down

To address this, we needed a deep understanding of older adults' fears, the barriers they face with technology, and how they experience the digital divide. This involved collecting qualitative data through **in-person interviews** with older adults, which allowed us to gather first-hand insights into their behaviours, motivations, and pain points.
![Figure 02: Selected quotes from the interview process](/assets/images/senda/senda-02-research-quotes.svg "full")

### Insights
The findings revealed several key insights, including fear of scams, reliance on family members, digital exclusion, and the loss of opportunities and well-being.

<section class="insights" aria-label="Key insights">
  <ul class="insights__track" id="insightsTrack">
    <li class="insight-card">
      <p class="insight-card__label">Digital exclusion</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">90%</p>
          <img class="insight-card__icon" src="/assets/images/senda/senda-research-percentage-90.svg" alt="">
        </div>
        <p class="insight-card__description">
          Think that technology is not for them and feel that the world is moving too fast.
        </p>
      </div>
    </li>
    <li class="insight-card">
      <p class="insight-card__label">Fear of scams</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">82%</p>
          <img class="insight-card__icon" src="/assets/images/senda/senda-research-percentage-82.svg" alt="">
        </div>
        <p class="insight-card__description">
          Feel insecure and exposed when making online payments due to the numerous scams.
        </p>
      </div>
    </li>
    <li class="insight-card">
      <p class="insight-card__label">Dependency</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">76%</p>
          <img class="insight-card__icon" src="/assets/images/senda/senda-research-percentage-76.svg" alt="">
        </div>
        <p class="insight-card__description">
          Depend on family members or third parties to carry out complex digital actions.
        </p>
      </div>
    </li>
    <li class="insight-card">
      <p class="insight-card__label">Loss of social opportunities and well-being</p>
      <div class="insight-card__content">
        <div class="insight-card__stat">
          <p class="insight-card__percentage">78%</p>
          <img class="insight-card__icon" src="/assets/images/senda/senda-research-percentage-78.svg" alt="">
        </div>
        <p class="insight-card__description">
          Lose out on social well-being opportunities by being unable to afford certain online procedures.
        </p>
      </div>
    </li>
  </ul>

  <div class="insights__controls">
    <button class="insights__arrow" data-scroll="prev" aria-label="Show previous insight">
      <!-- SVG flecha izquierda aquí, con aria-hidden="true" -->
    </button>
    <button class="insights__arrow" data-scroll="next" aria-label="Show next insight">
      <!-- SVG flecha derecha aquí, con aria-hidden="true" -->
    </button>
  </div>
</section>

Together, these observations pointed towards a broader need: making complex digital processes feel simpler, safer, and more manageable.


<p class="eyebrow">Problem</p>

## It was never about finding activities — it was about feeling safe enough to pay for them
The insights showed that the real challenge wasn't finding or signing up for leisure activities, but feeling secure while paying online for them. Users knew where to look for activities that interested them, but the digital payment step was a major setback. 
![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-03-strategic-shift.svg "full")

This led us to reframe the original hypothesis into the real problem to solve:

>People over the age of 70 need to make online payments securely, but they do not trust entering their bank card details online and lack simple alternatives that make them feel safe and confident.

From this reframed problem, we devised guided solutions, simplified steps, and a more empathetic tone.




<p class="eyebrow">Solution</p>

## A digital wallet that keeps their main bank account out of the equation

Senda offers an alternative approach to online payments through a digital wallet that can be topped up via the app — by requesting a transfer from a family member or caregiver — or in person at a trusted local store regularly visited by the user. This enables older adults to pay for their own leisure activities without exposing their main bank account or navigating complex banking environments.

### Every interaction was designed to reduce uncertainty
Based on our research insights, we defined three core design principles that guided every design decision, ensuring the final experience was tailored to users' needs:
> Empathetic  – Nimble – Reliable


### We focused the <abbr title="Minimum Viable Product">MVP</abbr> on the moments where confidence matters most

#### Key features
Before designing the user flows, we identified three key features that would shape the user experience: secure payments, hybrid top-ups, and trusted support. These served as the foundation for the app's overall functionality.

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-solution-key-features.svg "full")

#### User Roles
We defined two user roles: the Senior, who uses the app to make payments, and the Administrator, a trusted family member or caregiver responsible for managing and topping up the senior's balance. For the <abbr title="Minimum Viable Product">MVP</abbr>, we prioritized the Senior experience, as it represented the app's primary user journey.

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-solution-user-role-primary.svg "half")
![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-solution-user-role-secondary.svg "half")


#### Initial mapping
The next step was mapping the happy path for senior users making a payment. We started with the wallet top-up, as it represented users' first interaction with the payment experience and the stage where friction or uncertainty was most likely to occur. It was essential that this initial flow clearly communicated security and built users' confidence from the outset.

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-solution-sitemap.svg "full")



<p class="eyebrow">Testing</p>

## The core flow worked, but physical top-ups created friction

### Test Objectives
1. Evaluate the usability of the main features
2. Identify what users would do if they needed help with any process.
3. Identify which areas users interpret as clickable (e.g., the cards in the list of physical locations or the wallet in the request flow).
4. Identify whether users would like Senda to provide GPS-like guidance to help them locate the selected physical points.

### User Testing with maze
Testing was conducted remotely via Maze. The study involved two participant groups*: 11 users (people over 70 with difficulties making online payments) and 14 admins (caregivers who assist elderly users with digital tasks).

<div class="cs-note" role="note">
  <p class="cs-note__label">Note:</p>
  <p>*While the 25-person sample served as a solid exploratory foundation, a statistically representative sample would require 385 participants (5% margin of error, 95% confidence level) to draw conclusive findings at scale.</p>
</div>

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda-testing-maze.svg "full")

Heatmaps revealed where users tapped during usability testing, helping us assess whether they could easily identify the intended path. They also exposed interaction patterns and areas of confusion, such as misclicks and instances where users selected the wrong element.

### Evaluation

<div class="eval-grid">
  <div class="eval-card eval-card--win">
    <p>Users are able to request balance without complications.</p>
  </div>
  <div class="eval-card eval-card--pain">
    <p>Users have difficulties when topping up at physical locations.</p>
  </div>
  <div class="eval-card eval-card--pain">
    <p>Users had difficulties finding nearby physical locations.</p>
  </div>
  <div class="eval-card eval-card--pain">
    <p>Administrators have experienced difficulties when approving a top-up request.</p>
  </div>
</div>


### Iteration & refinement
Based on these insights, we identified several improvements before moving into the final <abbr title="Minimum Viable Product">MVP</abbr> UI:

1. Redesigning the physical recharge flow to reduce misclicks and improve interaction clarity.
2. Strengthening UI visuals so tappable elements were more obvious.
3. Introducing an optional "Get directions" button to support real-world navigation.
4. Adding an assistance flow so users could quickly access help when uncertain.


#### Final MVP User Flow

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda-testing-final-flow-1.svg "full")


<p class="eyebrow">Outcome</p>

## A simpler payment experience built around trust


### Final UI

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-outcome-final-ui-physical-top-up.svg "full")

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-outcome-final-ui-visual-identity.svg "full")

![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/videos/senda/senda-outcome-final-ui-wallets.mp4 "full")

### Final prototype

#### Request top-up with cash flow
![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-outcome-prototype-flow-request-top-up.svg "half")
![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-outcome-prototype-flow-request-top-up.svg "half")


#### Request balance to admin flow
![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-outcome-prototype-flow-request-top-up.svg "half")
![Figure 03: Self-created scheme of the MVP scope before and after.](/assets/images/senda/senda-outcome-prototype-flow-request-top-up.svg "half")

### Next steps
1. Introduce a brief, task-oriented onboarding.
2. Add an optional "How to get there" flow for physical locations.
3. Develop the administrator interface.




<p class="eyebrow">Reflection</p>

## Designing for confidence means designing beyond the interface

### Projected impact
 
1. Reducing digital gap and distrust: Current interfaces are not designed for older users; Senda, in contrast, offers an experience tailored to their needs, building trust.
2. Increasing initiative in online processes: By removing confusion and simplifying steps, users become less afraid of making mistakes and are more willing to engage with technology.
3. Promoting well-being and inclusion: We enable access to a wide range of activities and experiences for a key user group.

<div class="cs-note" role="note">
  <p class="cs-note__label">Note:</p>
  <p>As part of an academic project, the solution was not validated after launch. In a real-world scenario, success would be measured through metrics such as task completion rate, time on task, user confidence and satisfaction, and increased adoption of digital payments among older adults.</p>
</div>


### Takeaways
1. Tool choice and test structure impact data quality.
2. Copywriting directly shapes user understanding and flow.
3. Confirmation screens build confidence and reduce errors.