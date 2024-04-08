# AWS Serverless Node Typescript GraphQL API

This is a sample repo which showcases what a production-ready setup might look like when deploying to AWS using Serverless for a GraphQL-based Node API, written in Typescript.

There is also a built-in database connection (in this case I've chosen Postgres using Sequelize) which is established using a singleton pattern, outside of the Lambda handlers in order to re-use the connection across function calls.

**Important note:** If your application is expecting massive scale usage, then a better way of handling the db connection would be to build a separate API (not serverless) which is responsible solely for handling your database-related operations and consuming that. This will help you maintain the highest-level of efficiency in terms of extreme scalability.

## Why this stack

The idea here is to gain access to all the pros of serverless without losing out on all the features GraphQL can offer.

It's an efficient way to build APIs at scale whenever you do not need access to features like the file system for example or have a long-running task. Another thing to consider is multitenancy (sharing computing resources with other users) which is the usual case with serverless service providers (to be avoided mostly for security reasons). In those scenarios something like a Kubernetes Deployment paired with a Persistent Volume might be a better choice.

Here is a breakdown of each technology and why I've chosen it:

- **GraphQL:** Allows us to pick and choose our data and re-use endpoints which results in smaller payloads overall.
- **Serverless:** We only pay for executions and not constant alive-time and the computing resources needed to maintain that, and we also gain natural scalability.
- **Terraform:** Could be substituted with tools like Pulumi as well, the general idea is to use them in order to deploy the necessary resources (like ACM certificates) in order for our Serverless deployments to be served over HTTPS.

## Development

In order to work with the sample project locally:

1.  Run the `yarn install` command to install dependencies.
2.  (ONCE) Download the sample CSV with demo data for the example format from (here)[https://drive.google.com/file/d/1ejUBQGkehWtP_BD_Tg8Jg4Z7gzeVRnHL/view?usp=sharing] and place it inside of the `src/resolvers/queries` folder.
3.  (ONCE) Run the `yarn local:seed-db` command to seed some traffic data into your local db.
4.  Run the `yarn dev` command which will spin up local Adminer and Postgres instances.
5.  Query using your own client (either Insomnia/Postman or a local React/Remix/Next client)
6.  Once you're done developing make sure to run the `yarn docker:down` command in order to stop your local db and Adminer instances.

### Sample workflow:

One way to go about your development workflow could be to:

1. Develop locally, push to a feature branch.
2. This will run the testing pipeline and ensure your code is ready to go.
3. If step 2 succeeds and you're ready to get your changes into `staging` - create a PR from the feature branch into the `staging` branch and merge the PR.
4. This will run the "test and deploy" pipeline and ensure your deployment gets to the `staging` environment.
5. Repeat steps 1-4 until you're happy with the outcome.
6. Once you're content with the current `staging` version - create a PR from the `staging` branch into `main` and merge the PR.
7. The "test and deploy" pipeline will be run again, deploying your code to `production`.

And here's what you would do to ensure all environments are properly destroyed:

1. Run `yarn destroy` if you've ever deployed using your local enviornment (the `dev` stage) and the `yarn deploy` command.
2. Make a commit to a feature branch with a message equal to `env.DESTROY_KEYWORD`.
3. Create a PR from your feature branch into the `staging` branch, ensuring the PR title is equal to `env.DESTROY_KEYWORD` and merge this PR (you will again be asked to give a title to your PR upon accepting the merge so ensure that is also equal to `env.DESTROY_KEYWORD`).
4. The `cleanup` job will be run on the `staging` branch and if successful - the staging deployment will be removed.
5. Create a PR with with a title equal to `env.DESTROY_KEYWORD` from the `staging` branch into `main` and merge it (once again with a message equal to `env.DESTROY_KEYWORD`).
6. The `cleanup` job is run again, this time on the `production` environment, ensuring that gets deleted as well.
7. The bash scripts in the `scripts` folder will ensure to remove any leftover entities from the likes of AWS Route53 (such as hosted zones, etc.).

## Testing

This project employs both unit and integration tests using Jest, with the two configs being located in the root of the project (`jest.int.config.ts` and `jest.unit.config.ts`).

In order to execute the integration tests against a real Postgres instance, the `yarn test:int` command can be run.

This will also run the `pretest:int` script which will spin up the local docker-compose set up with 2 database instances - one for development and one for testing in order to keep data isolated and because when running tests, we want to always force-sync the database before the run to ensure the latest versions of the models are what we're using.

After tests execute, the `docker:down` command will be executed (even if tests fail) to ensure we destroy the local infrastructure.

You could, of course, create a separate Docker Compose file to only spin up the testing Postgres instance but this is an example so that's why I've placed everything in a single config.

Unit tests can be run using the `yarn test:unit` command.

To run all types of tests, the `yarn test:all` command can be used. It will run the integration tests first, followed by the unit tests.

In CI/CD we must also have a Postgres instance spun up before the testing step to ensure everything works as expected. This is done differently in most platforms but you can refer to this example for a way to do it using Github Actions.

**NOTE:** To keep things clean and separated we check if we're running in `test` mode and switch out the `POSTGRES_URL` connection string with the `POSTGRES_URL_TEST` one if the mode is `test`. This is why it's important to set that variable (`POSTGRES_URL_TEST`) in the testing step in the CI/CD pipeline.

## Deployment

The application can be deployed using `yarn deploy` which will take care of creating the necessary Terraform state and deploying the Serverless app to AWS.

When making your commits, you should use sem-ver (for example by calling `yarn version --patch | minor | major`) and then pushing to the remote branch.

The CI/CD pipeline for simply testing the source code will be activated when a commit to any branch other than `staging` or `main` is made.

Whenever you merge a PR into `main` or `staging` and close it, the `.github/workflows/test_and_deploy.yml` flow will be run which will take care of both testing again and deploying the app to the specific environment. Variables like `TF_VAR_environment` are adjusted automatically according to the branch to ensure deployment to the correct stage.

**IMPORTANT:** As a pre-requisite you need to ensure that all ENV variables described in the `env` segment of the `.github/workflows/test_and_deploy.yml` file are set correctly inside the platform you choose to use.

**NOTE:** The `TF_VAR_environment` variable is set by the pipeline and does not need to be defined explicitly, unless you plan on deploying to the `dev` environment using the `yarn deploy` command locally. Also the Terraform backend variables must be defined as Github Actions (or equivalent) variables and not secrets because otherwise the encoding will prohibit the `terraform init` command from executing correctly.

**NOTE:** If you're deploying locally you need to ensure to set up the `terraform/backend.conf` file so that Terraform can get initiated correctly. You must also ensure the `POSTGRES_URL` variable is pointing to an accessible Postgres instance because this is the string that will be used to connect to your db once the project is deployed.

This setup deploys to the following domains:

**Dev:** dev.`${DOMAIN_NAME}`

**Staging:** staging.`${DOMAIN_NAME}`

**Production:** `${DOMAIN_NAME}`

## Destruction

If you've only deployed using your local configuration (using `yarn deploy`) you can simply run `yarn destroy` which will take care of removing the Serverless deployment as well as the Terraform resources.

I've also integrated a destruction mechanism into the CI/CD pipeline which relies on a specific `DESTROY_KEYWORD`.

If the variable is set in the CI/CD environment you can create a commit with the keyword as the commit message and this will trigger the destruction flow to run.

**IMPORTANT:** For `main` and `staging` you need to merge a PR and have the PR name be equal to the `DESTROY_KEYWORD` in order to run the cleanup step there.

### Scripts in the `scripts` folder

There are two bash scripts located in the `scripts` folder, namely `scripts/remove_ns_record_from_hz.sh` and `scripts/delete_hz.sh`. There is a need for those in order to ensure this setup can be run reliably and because Terraform does not clean up all of the resources it creates due to the nature of the way it functions.

Here is what each script does:

`remove_ns_record_from_hz.sh` - Cleans up the NS record which maps the `${stage}.app.example.com` subdomain to the `app.example.com` subdomain or (if we're running the pipeline on the `main` branch) the record which maps `app.example.com` to `example.com`.

`delete_hz.sh` - Deletes the CNAME record created by Terraform for ACM certificate validation and then deletes the specific hosted zone used for the deployment (either `${stage}.app.example.com` or `app.example.com`).

### The problem

When destroying you need to mind the following issue **might** occur:

Because all N environments are hosted under the same base domain (as subdomains and production is hosted at the actual domain) this means that destroying one of them will also destroy the NS record used to map the base domain to the top-level domain. This will cause the rest of the environments to become unreachable. Here is an example:

Suppose we have a TLD (top-level domain) of `example.com`. We then choose our subdomain `app.example.com` as the desired one for the current project.

This means that sub-domains like `dev.app.example.com` and `staging.app.example.com` will be used for our environments and `app.example.com` will be used to host the production version.

When deploying our first environment (suppose `dev`), Terraform will create a hosted zone of `app.example.com` and link it to `example.com` via an NS record.

Then the same process will happen between `dev.app.example.com` and `app.example.com` in order to link those two together.

Same thing goes for each of `staging` and any other consequent envrionment we deploy but for those ones some of the resources are already present in the Terraform state and don't need to be re-created (such as the `app.example.com` hosted zone).

When destroying the `dev` environment, Terraform will have to also destroy the NS record linking `app.example.com` with `example.com` due to the nature in which Terraform operates, which will break the other envs as well.

### The solution

Fixing this issue is quite trivial and can be done in different ways but here are two options:

**Manually:** You need to create an NS record in the top-level domain (`example.com`) with the value of the NS record which is automatically assigned to the application subdomain (`app.example.com`) when creating the hosted zone for it (at creation time each hosted zone gets an SOA and and NS record created for it). This allows `example.com` to regain control of `app.example.com`.

**Automatically:** You can simply re-deploy any one of the environments (either using the CI/CD pipeline or locally using `yarn deploy`) and because Terraform will see that the NS record in the TLD is missing, it will re-create it, restoring the link between `example.com` and `app.example.com`.
