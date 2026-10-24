import { Navigate, useLocation } from 'react-router'
import { builtinWidgetPath, type BuiltinWidgetId } from '../../features/widgets/builtin-widgets'

export function LegacyWidgetRedirect({ tool }: { tool: BuiltinWidgetId }) {
  const location = useLocation()
  return (
    <Navigate
      replace
      to={builtinWidgetPath(tool, location.search, location.hash)}
      state={location.state}
    />
  )
}
