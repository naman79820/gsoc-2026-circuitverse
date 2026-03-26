# CircuitVerse Enterprise Organization Features (POC)

This repository serves as a Proof of Concept (POC) demonstrating the foundational architecture for the GSoC Project: **Enterprise & Institutional Organization Features**.

## Approach
Currently, CircuitVerse treats every user and classroom as completely separate. This POC introduces an [Organization](cci:2://file://wsl$/Ubuntu/home/naman/CircuitVerse/app/policies/organization_policy.rb:2:0-41:3) layer that sits above everything else, acting as the institution. Existing CircuitVerse [Groups](cci:2://file://wsl$/Ubuntu/home/naman/CircuitVerse/app/controllers/groups_controller.rb:2:0-112:3) (which act as classrooms) are then cleanly nested underneath the Organization. This provides universities a single pane of glass to manage departments, instructors, and students without breaking the existing standalone classroom functionality.

## DB Design
Instead of building a massive new system from ground zero, this relies on two new tables and one additive migration.

1. **`organizations` Table**: Holds the institution's core data (name, slug, email_domain, encrypted SSO credentials, and an `sso_protocol` field — either `oidc` or `saml`).
2. **`organization_members` Table**: A join table mapping a `User` to an [Organization](cci:2://file://wsl$/Ubuntu/home/naman/CircuitVerse/app/policies/organization_policy.rb:2:0-41:3) with a specific [role](cci:1://file://wsl$/Ubuntu/home/naman/CircuitVerse/app/controllers/organizations_controller.rb:74:2-78:5) enum.
3. **`groups` Table (Migration)**: Added an `organization_id` foreign key. This instantly networks the existing classroom engine into our new hierarchy.

## RBAC Logic
Permissions are strictly enforced at the controller level using **Pundit**. The system relies on four roles handled via an ActiveRecord enum (Admin, Group Lead, Instructor, Member).

* **Org Admin**: Can create/manage the overarching organization, add any tier of user (including Instructors), and manage all nested groups.
* **Instructor**: Blocked via Pundit from managing the overarching organization or adding staff. Restricted strictly to viewing the org and managing their specific assigned nested Groups.

*(Note: While the POC requirements strictly asked for [org_admin](cci:1://file://wsl$/Ubuntu/home/naman/CircuitVerse/app/policies/group_policy.rb:25:4-27:7) and [instructor](cci:1://file://wsl$/Ubuntu/home/naman/CircuitVerse/app/policies/group_policy.rb:29:4-31:7), I designed the `OrganizationMember` enum to preemptively support `group_lead` and `student` as well. This proves the database architecture naturally scales to support the full 4-role requirement of the GSoC proposal without needing future structural rewrites!)*

## SSO Architecture
Each organisation stores its own SSO credentials. The `sso_protocol` field routes authentication at runtime through either `omniauth-openid-connect` (for Google Workspace/Azure AD) or `ruby-saml` (for legacy SAML 2.0 IdPs like Shibboleth). Both paths converge into the same domain-to-org mapping logic.
