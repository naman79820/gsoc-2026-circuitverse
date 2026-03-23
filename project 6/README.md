# CircuitVerse Enterprise Organization Features (POC)

This repository serves as a Proof of Concept (POC) demonstrating the foundational architecture for the GSoC Project: **Enterprise & Institutional Organization Features**.

## Approach
Currently, CircuitVerse treats every user and classroom as completely separate. This POC introduces an `Organization` layer that sits above everything else, acting as the institution. Existing CircuitVerse `Groups` (which act as classrooms) are then cleanly nested underneath the Organization. This provides universities a single pane of glass to manage departments, instructors, and students without breaking the existing standalone classroom functionality.

## DB Design
Instead of building a massive new system from ground zero, this relies on two new tables and one additive migration.

1. **`organizations` Table**: Holds the institution's core data (name, slug, email_domain, encrypted OIDC credentials).
2. **`organization_members` Table**: A join table mapping a `User` to an `Organization` with a specific `role` enum.
3. **`groups` Table (Migration)**: Added an `organization_id` foreign key. This instantly networks the existing classroom engine into our new hierarchy.

## RBAC Logic
Permissions are strictly enforced at the controller level using **Pundit**. The system relies on four roles handled via an ActiveRecord enum (Admin, Group Lead, Instructor, Member).

* **Org Admin**: Can create/manage the overarching organization, add any tier of user (including Instructors), and manage all nested groups.
* **Instructor**: Blocked via Pundit from managing the overarching organization or adding staff. Restricted strictly to viewing the org and managing their specific assigned nested Groups. 

*(Note: While the POC requirements strictly asked for `org_admin` and `instructor`, I designed the `OrganizationMember` enum to preemptively support `group_lead` and `student` as well. This proves the database architecture naturally scales to support the full 4-role requirement of the GSoC proposal without needing future structural rewrites!)*
