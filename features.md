# 1、添加esa-deploy.yml

```yml
name: Deploy LiteASCII to Aliyun ESA

on:
  push:
    branches:
      - main  # 监听你的主分支

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install Dependencies
        run: pnpm install

      - name: Build Astro Site
        # 记得带上你用来抓取 Star 数的 GitHub Token
        env:
          GITHUB_TOKEN: ${{ secrets.MY_GITHUB_TOKEN }}
        run: pnpm build

      - name: Deploy to Aliyun ESA
        env:
          ALIBABA_CLOUD_ACCESS_KEY_ID: ${{ secrets.ALIBABA_CLOUD_ACCESS_KEY_ID }}
          ALIBABA_CLOUD_ACCESS_KEY_SECRET: ${{ secrets.ALIBABA_CLOUD_ACCESS_KEY_SECRET }}
        # --yes 跳过交互式确认，直接静默部署
        run: |
            npx esa-cli login \
                --ak $ALIBABA_CLOUD_ACCESS_KEY_ID \
                --sk $ALIBABA_CLOUD_ACCESS_KEY_SECRET

            npx esa-cli deploy 
```

# 2、修改config.ts文件中的GitHub repo

```ts
  // 社交链接与 GitHub 展示配置

  github: {
    username: 'your-github-name', // 你的 GitHub 用户名
    repo: 'your-repo',          // 默认展示的主仓库名
  },
```

# 3、在仓库的Repository secrets更新三种变量

MY_GITHUB_TOKEN

ALIBABA_CLOUD_ACCESS_KEY_ID

ALIBABA_CLOUD_ACCESS_KEY_SECRET
