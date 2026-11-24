Follow ARCHITECTURE.md for every design and build step.
Project: Product Rule Doctor, a read-only diagnostic for Salesforce CPQ product rules.
Org: my default Salesforce org (Developer Edition). All data is SYNTHETIC; never use real customer or company data.
Bundle under test: Process Instrumentation Pack (Demo).
Read only by default: never create, update or delete Salesforce records unless I explicitly approve that exact change.
Send only field names plus 1 or 2 sample rows when writing code. Run analysis locally.
Stop on any error and show the exact error.
Never guess API names or relationship names. Check them with sf sobject describe first, or use simple queries that avoid relationships.
