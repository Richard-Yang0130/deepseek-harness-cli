import React from 'react'
import { Box, Text } from 'ink'
import type { BannerFacts } from '../banner-facts.js'
import type { TuiControllerSnapshot } from '../controller.js'
import { WELCOME_BOX_MIN } from '../layout.js'
import { WelcomeBox, HorizontalRule } from './WelcomeBox.js'
import { Whale } from './Whale.js'

const BRAND_COLOR = '#4D6BFE'

function LeftColumn({ model, cwd }: { readonly model: string; readonly cwd: string }): React.JSX.Element {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      <Whale />
      <Text bold>Welcome back!</Text>
      <Text dimColor wrap="truncate-end">{model}</Text>
      <Text dimColor wrap="truncate-start">{cwd}</Text>
    </Box>
  )
}

function RightColumn({ bannerFacts }: { readonly bannerFacts?: BannerFacts }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text color={BRAND_COLOR}>快速上手</Text>
      <Text wrap="truncate-end">输入 / 打开命令菜单，Enter 发送</Text>
      <Text wrap="truncate-end">输入 /help 查看全部命令</Text>
      {bannerFacts?.latest === undefined ? null : (
        <>
          <HorizontalRule />
          <Text color={BRAND_COLOR} wrap="truncate-end">本次更新 v{bannerFacts.latest.version}</Text>
          {bannerFacts.latest.bullets.map(bullet => (
            <Text key={bullet} wrap="truncate-end">• {bullet}</Text>
          ))}
        </>
      )}
    </Box>
  )
}

export function Header({ snapshot, columns, bannerFacts }: {
  readonly snapshot: TuiControllerSnapshot
  readonly columns: number
  readonly bannerFacts?: BannerFacts
}): React.JSX.Element {
  const model = snapshot.model === undefined ? 'model loading…' : snapshot.model
  if (columns < WELCOME_BOX_MIN) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Box><Whale /><Text bold color={BRAND_COLOR}> DeepSeek Harness</Text></Box>
        <Text>{model}</Text>
      </Box>
    )
  }

  const title = `DeepSeek Harness${bannerFacts?.version === undefined ? '' : ` v${bannerFacts.version}`}`
  return (
    <Box marginBottom={1}>
      <WelcomeBox
        title={title}
        width={columns - 2}
        left={<LeftColumn model={model} cwd={snapshot.cwd} />}
        right={<RightColumn {...bannerFacts === undefined ? {} : { bannerFacts }} />}
      />
    </Box>
  )
}
